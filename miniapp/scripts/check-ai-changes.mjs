/**
 * 小程序端改动校验（沙箱里跑不动 uni 构建，因此直接对模块做行为断言）。
 *
 *   1. utils/markdown.js：嵌套 <details> 展平（含"两个顶层折叠块"与"总容器套三路"）
 *   2. utils/aiTypes.js：normalizeRetrievalChannels / normalizePayload 的三路通道归一
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const sfc = require('vue/compiler-sfc')

const ROOT = process.cwd()
let failed = 0
const ok = (cond, label, detail = '') => {
  console.log(`  [${cond ? 'OK  ' : 'FAIL'}] ${label}${detail ? '  —— ' + detail : ''}`)
  if (!cond) failed++
}

/* ---------------- 1. 单文件组件编译 ---------------- */
console.log('='.repeat(72))
console.log('1. 小程序单文件组件编译')
console.log('='.repeat(72))
for (const rel of [
  'src/components/ai/SourceList.vue',
  'src/components/ai/PrescriptionCard.vue',
  'src/components/MarkdownRender.vue',
  'src/pages/chat/chat.vue',
]) {
  const abs = path.join(ROOT, rel)
  const { descriptor, errors } = sfc.parse(readFileSync(abs, 'utf8'), { filename: abs })
  if (errors.length) {
    ok(false, `${rel} 解析`, errors.map((e) => e.message).join('; '))
    continue
  }
  try {
    const id = rel.replace(/[^a-z0-9]/gi, '')
    if (descriptor.scriptSetup || descriptor.script) sfc.compileScript(descriptor, { id, isProd: false })
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

/* ---------------- 2. markdown 折叠块展平 ---------------- */
console.log('\n' + '='.repeat(72))
console.log('2. markdown.js 嵌套折叠块展平')
console.log('='.repeat(72))

const md = await import(pathToFileURL(path.join(ROOT, 'src/utils/markdown.js')).href)
const { mdToHtml, mdToPlainText } = md

// 模拟后端真实回答：开头推理摘要 + 正文 + 结尾「检索来源」总容器套三路通道
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
  '<summary>📚 本地知识库（2 条）</summary>',
  '',
  '1. 稻瘟病防治：分蘖期喷施三环唑。',
  '2. 高湿条件下流行快。',
  '',
  '</details>',
  '',
  '<details>',
  '<summary>🕸️ 知识图谱（1 条）</summary>',
  '',
  '1. 水稻 --危害--> 稻瘟病',
  '',
  '</details>',
  '',
  '<details>',
  '<summary>🌐 联网搜索（无结果）</summary>',
  '',
  '- 本次未从该通道取到可用内容。',
  '',
  '</details>',
  '',
  '</details>',
].join('\n')

const html = mdToHtml(answer)
ok(!/&lt;details|&lt;\/details|<details|<summary/i.test(html), '展平后不再有 details/summary 标签或转义残留')
ok(html.includes('结论'), '正文保留')
ok(html.includes('推理摘要'), '第一个顶层折叠块（推理摘要）标题保留')
ok(html.includes('检索来源'), '第二个顶层折叠块（检索来源）标题保留')
ok(html.includes('本地知识库') && html.includes('知识图谱') && html.includes('联网搜索'),
  '三路通道标题全部保留（非贪婪正则会漏掉后两路）')
ok(html.includes('稻瘟病防治') && html.includes('水稻 --危害--&gt; 稻瘟病'),
  '内层通道的源文字正文全部保留（`>` 按 XSS 防护转义为 &gt;，属预期）')
ok(html.includes('本次未从该通道取到可用内容'), '空通道的说明也保留')

// 反向用例：两个顶层块之间的正文不能被贪婪匹配吞掉
ok(html.includes('喷施三环唑'), '两个顶层折叠块之间的正文没有被吞掉')

// 非折叠内容原样保留
const plain = mdToHtml('普通一段话，没有折叠块。')
ok(plain.includes('普通一段话'), '无折叠块时原样输出')

// 纯文本路径（语音播报）不受影响
const spoken = mdToPlainText(answer)
ok(!spoken.includes('details') && !spoken.includes('<'), 'mdToPlainText 无标签残留')

/* ---------------- 3. aiTypes 三路通道归一 ---------------- */
console.log('\n' + '='.repeat(72))
console.log('3. aiTypes.normalizeRetrievalChannels 行为')
console.log('='.repeat(72))

const t = await import(pathToFileURL(path.join(ROOT, 'src/utils/aiTypes.js')).href)
const { normalizeRetrievalChannels, normalizePayload, sourceTypeLabel, matchRateText,
        stripRetrievalContainer } = t

const raw = [
  { key: 'kb', label: '本地知识库', icon: '📚', status: 'ok', count: 2,
    detail: '检索模式 hybrid，向量命中 2 条',
    items: [
      { title: '水稻病虫害防治手册', source_text: '稻瘟病防治：分蘖期喷施三环唑。', similarity: 0.7, doc_id: 'd1' },
      { title: '植保站资料', source_text: '高湿条件下病害流行快。', score: 1.1 },
    ] },
  { key: 'kg', label: '知识图谱', icon: '🕸️', status: 'ok', count: 1,
    items: [{ title: '水稻 → 稻瘟病', source_text: '水稻 --危害--> 稻瘟病' }] },
  { key: 'web', label: '联网搜索', icon: '🌐', status: 'empty', count: 0,
    detail: '本地依据已足够回答该问题，本次未联网' },
]
const ch = normalizeRetrievalChannels(raw)
ok(ch.length === 3, '三路通道都被保留', `得到 ${ch.length}`)
ok(ch[0].items[0].source_text === '稻瘟病防治：分蘖期喷施三环唑。', '源文字透传正确')
ok(ch[2].status_label === '无结果' && ch[2].has_content === true, '空通道仍算有内容（要显示状态说明）')
ok(ch[0].color === '#2D7A4A', '通道配色注入，供小程序内联样式使用')
ok(normalizeRetrievalChannels(undefined).length === 0, '缺字段返回空数组，不抛异常')
ok(matchRateText(ch[0].items[0]).text === '70%', 'similarity 换算匹配度', matchRateText(ch[0].items[0]).text)
ok(sourceTypeLabel('web') === '网络', '扁平来源的类型标签仍可用')

const payload = normalizePayload({ source_meta: { retrieval_channels: raw } })
ok(payload.retrieval_channels.length === 3, 'normalizePayload 顶层暴露 retrieval_channels')
ok(payload.source_meta.retrieval_channels.length === 3, 'source_meta 内也保留一份')

/* ---------------- 4. 去掉正文里的重复来源容器 ---------------- */
console.log('\n' + '='.repeat(72))
console.log('4. stripRetrievalContainer 去重')
console.log('='.repeat(72))

const stripped = stripRetrievalContainer(answer)
ok(!stripped.includes('检索来源'), '「检索来源」容器已摘掉')
ok(stripped.includes('推理摘要'), '开头的「推理摘要」保留')
ok(stripped.includes('喷施三环唑'), '两个折叠块之间的正文保留')
ok(!stripped.includes('稻瘟病防治：分蘖期'), '容器内的源文字一并移除（避免重复展示）')
ok(stripped.includes('<details>') && stripped.includes('</details>'), '推理摘要的标签仍完整')
ok(stripRetrievalContainer('没有折叠块') === '没有折叠块', '无标记时原样返回')
ok(stripRetrievalContainer(answer).split('<details>').length === 2, '只留下 1 个 details 块')

console.log('\n' + '='.repeat(72))
console.log(failed ? `校验失败：${failed} 项` : '小程序端改动校验通过')
console.log('='.repeat(72))
process.exit(failed ? 1 : 0)
