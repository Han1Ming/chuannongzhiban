/**
 * 前端改动校验（不依赖 vite 构建：沙箱里 vite 会因为 spawn 子进程被拒而 EPERM）。
 *
 * 做两件事：
 *   1. 用 @vue/compiler-sfc 解析并编译改过的单文件组件，模板/script 语法错误会在这里暴露；
 *   2. 动态 import 改过的 utils/aiTypes.js，跑一遍 normalizeRetrievalChannels 的真实断言。
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const sfc = require('vue/compiler-sfc')

const ROOT = process.cwd()
const FILES = [
  'src/components/ai/SourceList.vue',
  'src/components/ai/PrescriptionCard.vue',
  'src/views/chat/ChatView.vue',
]
let failed = 0
const ok = (cond, label, detail = '') => {
  console.log(`  [${cond ? 'OK  ' : 'FAIL'}] ${label}${detail ? '  —— ' + detail : ''}`)
  if (!cond) failed++
}

console.log('='.repeat(72))
console.log('1. 单文件组件编译')
console.log('='.repeat(72))
for (const rel of FILES) {
  const abs = path.join(ROOT, rel)
  const source = readFileSync(abs, 'utf8')
  const { descriptor, errors } = sfc.parse(source, { filename: abs })
  if (errors.length) {
    ok(false, `${rel} 解析`, errors.map((e) => e.message).join('; '))
    continue
  }
  try {
    const id = rel.replace(/[^a-z0-9]/gi, '')
    if (descriptor.scriptSetup || descriptor.script) {
      sfc.compileScript(descriptor, { id, isProd: false })
    }
    if (descriptor.template) {
      const res = sfc.compileTemplate({
        source: descriptor.template.content,
        filename: abs,
        id,
        compilerOptions: { mode: 'module' },
      })
      if (res.errors?.length) {
        ok(false, `${rel} 模板`, res.errors.map((e) => String(e.message || e)).join('; '))
        continue
      }
    }
    ok(true, `${rel} 编译通过`)
  } catch (err) {
    ok(false, `${rel} 编译异常`, String(err.message || err))
  }
}

console.log('\n' + '='.repeat(72))
console.log('2. aiTypes.normalizeRetrievalChannels 行为')
console.log('='.repeat(72))

// Windows 下 ESM 动态 import 必须用 file:// URL（直接给 D:\... 会 ERR_UNSUPPORTED_ESM_URL_SCHEME）
const mod = await import(pathToFileURL(path.join(ROOT, 'src/utils/aiTypes.js')).href)
const { normalizeRetrievalChannels, normalizePayload, RETRIEVAL_CHANNEL_META,
        stripRetrievalContainer } = mod

ok(!!RETRIEVAL_CHANNEL_META.kb && !!RETRIEVAL_CHANNEL_META.kg && !!RETRIEVAL_CHANNEL_META.web,
  '三路通道元信息齐全')

const raw = [
  { key: 'kb', label: '本地知识库', icon: '📚', status: 'ok', count: 2,
    detail: '检索模式 hybrid，向量命中 2 条',
    items: [
      { title: '水稻病虫害防治手册', source_text: '稻瘟病防治：分蘖期喷施三环唑。', similarity: 0.7, doc_id: 'doc_002' },
      { title: '植保站资料', source_text: '高湿条件下病害流行快。', score: 1.1 },
    ] },
  { key: 'kg', label: '知识图谱', icon: '🕸️', status: 'ok', count: 1,
    items: [{ title: '水稻 → 稻瘟病', source_text: '水稻 --危害--> 稻瘟病', similarity: 0.5,
              graph_path: { path: ['水稻', '稻瘟病'], rels: ['HARMS'] } }] },
  { key: 'web', label: '联网搜索', icon: '🌐', status: 'empty', count: 0,
    detail: '本地依据已足够回答该问题，本次未联网' },
]
const ch = normalizeRetrievalChannels(raw)
ok(ch.length === 3, '三路通道都被保留', `得到 ${ch.length}`)
ok(ch[0].style.color === RETRIEVAL_CHANNEL_META.kb.color, '通道配色来自元信息')
ok(ch[0].items[0].source_text === '稻瘟病防治：分蘖期喷施三环唑。', '源文字透传正确')
ok(Math.round(ch[0].items[0].matchPercent) === 70, 'similarity 换算成匹配度百分比',
  String(ch[0].items[0].matchPercent))
ok(ch[2].status_label === '无结果' && ch[2].has_content === true,
  '空通道仍算"有内容"（要显示状态说明）')
ok(ch[1].items[0].graph_path?.path?.length === 2, '图谱路径保留，供图谱组件渲染')
ok(normalizeRetrievalChannels(undefined).length === 0, '缺字段时返回空数组，不抛异常')
ok(normalizeRetrievalChannels([{ key: 'unknown-ch' }])[0].label === '本地知识库',
  '未知通道 key 有兜底元信息')

const payload = normalizePayload({ source_meta: { retrieval_channels: raw } })
ok(payload.retrieval_channels.length === 3, 'normalizePayload 顶层暴露 retrieval_channels')
ok(payload.source_meta.retrieval_channels.length === 3, 'source_meta 内也保留一份')

console.log('\n' + '='.repeat(72))
console.log('3. stripRetrievalContainer 去掉正文里重复的来源容器')
console.log('='.repeat(72))

const answer = [
  '<details>',
  '<summary>📋 推理摘要</summary>',
  '',
  '- 处理过程：知识检索 → 决策生成',
  '</details>',
  '',
  '**结论**：喷施三环唑。',
  '',
  '<details>',
  '<summary>🔗 检索来源（3 条 · 本地知识库 / 知识图谱 / 联网搜索）</summary>',
  '',
  '<details>',
  '<summary>📚 本地知识库（1 条）</summary>',
  '',
  '1. 稻瘟病防治：分蘖期喷施三环唑。',
  '',
  '</details>',
  '',
  '</details>',
].join('\n')

const stripped = stripRetrievalContainer(answer)
ok(!stripped.includes('检索来源'), '「检索来源」容器已摘掉')
ok(stripped.includes('推理摘要'), '开头的「推理摘要」保留（仍由 Markdown 折叠渲染）')
ok(stripped.includes('喷施三环唑'), '两个折叠块之间的正文保留')
ok(!stripped.includes('稻瘟病防治：分蘖期'), '容器内的源文字一并移除（避免与组件重复）')
ok(stripRetrievalContainer('没有折叠块') === '没有折叠块', '无标记时原样返回')
ok(stripRetrievalContainer(answer).split('<details>').length === 2, '只留下 1 个 details 块')

console.log('\n' + '='.repeat(72))
console.log(failed ? `校验失败：${failed} 项` : '前端改动校验通过')
console.log('='.repeat(72))
process.exit(failed ? 1 : 0)
