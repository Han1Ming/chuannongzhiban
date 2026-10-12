import { ref } from 'vue'
import { textToSpeech } from '@/api/multimodal'
import { ElMessage } from 'element-plus'

/**
 * 语音朗读：**全站单例**状态。
 *
 * 为什么必须是单例而不是每个卡片各持一份：
 * 一条会话里有很多条回答，如果播放态放在 MessageActions 组件内部，
 * 用户连点两条回答的喇叭就会出现「两个按钮同时显示播放中」并且两段声音叠着播。
 * 这里用模块级的 ref 保存唯一的播放态，任何一次新的播放都先把上一次停干净。
 *
 * 引擎仍是原有的两级降级链路（重构图标时不能丢）：
 *   后端 TTS（DashScope CosyVoice，收费、有额度）
 *     └─ 失败 / 额度耗尽 / 未返回音频 → 浏览器原生 speechSynthesis（零成本、不依赖网络）
 *
 * 状态机：
 *   idle ──点击──▶ loading ──▶ playing ⇄ paused
 *                     │
 *                     └─ 后端失败 → 本地兜底（同样进 playing/paused）
 */

/** 当前持有播放态的消息 key；null 表示没有任何一条在播 */
const activeKey = ref(null)
/** 当前引擎：null | 'server' | 'local'，用于决定暂停/继续走哪条路径 */
const engine = ref(null)
/** idle | loading | playing | paused */
const status = ref('idle')

/** 后端音频元素（server 引擎） */
let currentAudio = null

const isBrowserSpeechAvailable = () =>
  typeof window !== 'undefined' && !!window.speechSynthesis

/**
 * 把状态复位成 idle。
 * 注意 activeKey 与 engine 必须一起清，只清其中一个会让按钮卡在「播放中」再也点不动。
 */
function reset() {
  activeKey.value = null
  engine.value = null
  status.value = 'idle'
}

/** 停止一切正在进行的播放（后端音频 + 浏览器播报都要停） */
function stop() {
  if (currentAudio) {
    currentAudio.onended = null
    currentAudio.onerror = null
    currentAudio.pause()
    currentAudio = null
  }
  if (isBrowserSpeechAvailable()) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* 个别浏览器在无播报任务时 cancel 会抛，忽略即可 */
    }
  }
  reset()
}

/**
 * 浏览器本地播报兜底。
 * 后端 TTS 是收费能力，额度耗尽时整条链路不可用；网页端有原生 speechSynthesis，
 * 零成本且不依赖网络，因此后端不可用时自动改用它，用户仍然能「听」到回答——
 * 这比只弹一句「语音合成失败」有用得多。
 */
function speakLocally(cleanText) {
  if (!isBrowserSpeechAvailable()) return false
  try {
    const synth = window.speechSynthesis
    synth.cancel()
    const utter = new SpeechSynthesisUtterance(cleanText)
    utter.lang = 'zh-CN'
    utter.rate = 1.0
    // 结束/出错都必须复位，否则按钮永远停在「播放中」
    utter.onend = () => {
      if (engine.value === 'local') reset()
    }
    utter.onerror = () => {
      if (engine.value === 'local') reset()
    }
    synth.speak(utter)
    return true
  } catch {
    return false
  }
}

/**
 * 点击朗读按钮：同一段内容再次点击 = 暂停/继续，换一段内容 = 从头播。
 * @param {string} key  消息的唯一标识（用内容 + 下标拼即可，只要求同一条消息稳定）
 * @param {string} text 原始回答文本（含 Markdown，这里只做最朴素的清洗）
 */
async function toggle(key, text) {
  // ---- 1. 点的是正在播/已暂停的同一条 → 切换暂停 / 继续 ----
  if (activeKey.value === key) {
    if (status.value === 'loading') return // 正在请求后端，忽略重复点击
    if (engine.value === 'server' && currentAudio) {
      if (status.value === 'playing') {
        currentAudio.pause()
        status.value = 'paused'
      } else {
        try {
          await currentAudio.play()
          status.value = 'playing'
        } catch {
          // 继续播放失败（音频被回收等）→ 退回待播，让用户能重来一次
          stop()
        }
      }
      return
    }
    if (engine.value === 'local' && isBrowserSpeechAvailable()) {
      const synth = window.speechSynthesis
      if (status.value === 'playing') {
        synth.pause()
        status.value = 'paused'
      } else {
        synth.resume()
        status.value = 'playing'
      }
      return
    }
  }

  // ---- 2. 换内容：先把上一条停干净，避免两个声音叠着播 ----
  stop()

  const cleanText = (text || '').replace(/<[^>]*>/g, '').replace(/[#*`>|-]/g, '').trim().slice(0, 500)
  if (!cleanText) {
    ElMessage.warning('这条回答没有可朗读的文字')
    return
  }

  activeKey.value = key
  status.value = 'loading'

  let failure = ''
  try {
    const r = await textToSpeech(cleanText)
    if (r?.audio_base64) {
      // 必须用后端返回的**实际**格式：曾出现"字节是 WAV、前端按 mp3 解码"导致播放无声
      const audio = new Audio('data:audio/' + (r.format || 'mp3') + ';base64,' + r.audio_base64)
      currentAudio = audio
      engine.value = 'server'
      await audio.play().catch(() => {
        throw new Error('浏览器无法解码后端返回的音频')
      })
      status.value = 'playing'
      audio.onended = () => {
        if (activeKey.value === key) stop()
      }
      audio.onerror = () => {
        if (activeKey.value === key) stop()
      }
      return
    }
    failure = r?.error || '语音合成服务未返回音频'
  } catch (e) {
    failure = e?.message || '语音合成请求失败'
  }

  // ---- 3. 后端不可用 → 本地播报兜底，并如实说明原因 ----
  engine.value = 'local'
  if (speakLocally(cleanText)) {
    status.value = 'playing'
    ElMessage.warning(`${failure}，已改用浏览器本地语音播报`)
  } else {
    stop()
    ElMessage.error(`语音播报失败：${failure}`)
  }
}

export function useSpeech() {
  /** 某个按钮当前应当呈现的状态（不属于它的消息一律是 idle） */
  const stateOf = (key) => (activeKey.value === key ? status.value : 'idle')
  return { toggle, stop, stateOf }
}
