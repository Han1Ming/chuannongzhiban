<template>
  <div
    class="flex flex-1 min-h-0 overflow-hidden"
    style="background: var(--cream)"
  >
    <!-- ====== 侧边栏 ====== -->
    <aside
      class="relative flex flex-col shrink-0 transition-all duration-400 z-20"
      :style="{ width: '300px', marginLeft: sidebar ? '0' : '-300px' }"
      style="
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-right: 1px solid rgba(232, 224, 212, 0.6);
      "
    >
      <div
        class="flex items-center justify-between p-5 border-b shrink-0"
        style="border-color: rgba(232, 224, 212, 0.5)"
      >
        <h3
          class="font-['Noto_Serif_SC'] font-bold text-sm tracking-wide"
          style="color: var(--brown)"
        >
          对话历史
        </h3>
        <button
          class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90 hover:scale-110 cursor-pointer"
          style="background: var(--green-mist); color: var(--green)"
          @click="startNew"
        >
          <el-icon :size="16"><Plus /></el-icon>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-2">
        <div
          v-for="c in chat.conversations"
          :key="c.id"
          class="chat-session-item group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer mb-1 transition-all duration-200 relative overflow-hidden"
          :class="c.id === chat.currentId ? 'session-active' : ''"
          @click="chat.switchConversation(c.id)"
        >
          <div
            class="session-indicator absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-300"
            :class="
              c.id === chat.currentId
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-60'
            "
            style="
              background: linear-gradient(
                180deg,
                var(--green),
                var(--green-light)
              );
            "
          ></div>
          <el-icon
            :size="15"
            class="shrink-0"
            :style="{
              color: c.id === chat.currentId ? 'var(--green)' : '#ccc',
            }"
          >
            <ChatDotRound />
          </el-icon>
          <span
            class="truncate flex-1 text-sm font-medium"
            :style="{
              color:
                c.id === chat.currentId
                  ? 'var(--green-deep)'
                  : 'var(--brown-soft)',
            }"
            >{{ c.title }}</span
          >
          <span class="text-[11px] shrink-0 opacity-50">{{
            formatDate(c.createdAt, "MM/DD")
          }}</span>
          <button
            class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 cursor-pointer"
            style="background: rgba(220, 38, 38, 0.08); color: #dc2626"
            @click.stop="chat.delConv(c.id)"
          >
            <el-icon :size="12"><Delete /></el-icon>
          </button>
        </div>

        <div v-if="!chat.conversations.length" class="text-center py-16">
          <div class="text-5xl mb-4 opacity-30">📝</div>
          <p class="text-sm opacity-40">还没有对话记录</p>
          <p class="text-xs opacity-25 mt-1">点击 + 开始新的对话</p>
        </div>
      </div>

      <button
        class="absolute -right-[30px] top-1/2 -translate-y-1/2 w-[30px] h-14 bg-white/90 backdrop-blur border border-[#e8e0d4] border-l-0 rounded-r-xl flex items-center justify-center cursor-pointer z-10 transition-colors hover:text-[var(--green)]"
        style="color: #999"
        @click="sidebar = !sidebar"
      >
        <el-icon
          :size="16"
          class="transition-transform duration-300"
          :style="{ transform: sidebar ? 'rotate(0deg)' : 'rotate(180deg)' }"
        >
          <DArrowLeft />
        </el-icon>
      </button>
    </aside>

    <!-- ====== 主区域 ====== -->
    <div class="flex-1 flex flex-col min-w-0 relative">
      <div ref="$msgArea" class="flex-1 overflow-y-auto px-4 md:px-10 py-8">
        <!-- ====== 欢迎页 ====== -->
        <div
          v-if="!chat.currentMessages.length && !chat.isStreaming"
          class="welcome-area flex items-center justify-center min-h-full"
        >
          <div class="welcome-content text-center max-w-lg mx-auto">
            <div class="welcome-glow"></div>
            <div class="welcome-illustration relative mb-8">
              <div
                class="w-28 h-28 mx-auto rounded-[2rem] flex items-center justify-center relative z-10"
                style="
                  background: linear-gradient(
                    135deg,
                    var(--green-mist),
                    #d4edda
                  );
                "
              >
                <span class="text-6xl">🌾</span>
              </div>
              <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-[#E8F5E9]/40 blur-3xl"
              ></div>
            </div>
            <h2
              class="font-['Noto_Serif_SC'] text-3xl font-bold mb-3"
              style="
                color: var(--green-deep);
                text-shadow: 0 2px 12px rgba(26, 74, 46, 0.08);
              "
            >
              川农智伴 · AI 农业助手
            </h2>
            <p
              class="text-sm mb-8 leading-relaxed"
              style="color: var(--brown-faint)"
            >
              由大语言模型驱动，专为川南地区农业生产提供智能服务
            </p>
            <div
              class="text-left p-6 rounded-2xl bg-white/80 backdrop-blur border border-[#e8e0d4]/60 mb-8 text-sm leading-relaxed"
              style="
                color: var(--brown-soft);
                box-shadow: 0 8px 32px rgba(26, 74, 46, 0.04);
              "
            >
              <p class="mb-3 font-medium" style="color: var(--brown)">
                我可以帮您：
              </p>
              <ul class="space-y-2 pl-1">
                <li class="flex items-start gap-2">
                  <span class="shrink-0 mt-0.5">🔍</span
                  >解答水稻、柑橘、茶叶等农作物种植技术问题
                </li>
                <li class="flex items-start gap-2">
                  <span class="shrink-0 mt-0.5">🐛</span
                  >识别作物病虫害并提供防治建议（支持上传图片诊断）
                </li>
                <li class="flex items-start gap-2">
                  <span class="shrink-0 mt-0.5">📊</span
                  >查询农业政策、市场行情与种植方案
                </li>
                <li class="flex items-start gap-2">
                  <span class="shrink-0 mt-0.5">🧮</span>辅助计算种植成本与收益
                </li>
                <li class="flex items-start gap-2">
                  <span class="shrink-0 mt-0.5">🗣️</span
                  >支持语音输入与语音播报（点击小喇叭收听）
                </li>
              </ul>
            </div>
            <div class="flex flex-wrap gap-2.5 justify-center">
              <button
                v-for="(q, qi) in quick"
                :key="q"
                class="quick-btn px-5 py-2.5 rounded-full text-sm border transition-all duration-300 cursor-pointer"
                :style="{
                  borderColor: 'var(--green-mist)',
                  color: 'var(--green)',
                  animationDelay: 0.1 * qi + 's',
                }"
                @click="send(q)"
              >
                {{ q }}
              </button>
            </div>
            <p class="text-xs mt-8 opacity-30">
              请在下方输入您的问题，或使用图片/语音功能
            </p>
          </div>
        </div>

        <!-- ====== 消息列表 ====== -->
        <transition-group name="msg" tag="div">
          <div
            v-for="(m, i) in chat.currentMessages"
            :key="i"
            class="flex gap-3 mb-6 msg-item"
            :class="m.role === 'user' ? 'flex-row-reverse' : 'max-w-[82%]'"
          >
            <div
              class="msg-avatar w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              :style="{
                background:
                  m.role === 'user'
                    ? 'linear-gradient(135deg,var(--green),var(--green-light))'
                    : 'linear-gradient(135deg,var(--earth-light),var(--earth))',
                color: m.role === 'user' ? '#fff' : 'var(--brown-soft)',
                boxShadow:
                  m.role === 'user'
                    ? '0 4px 12px rgba(45,122,74,0.25)'
                    : '0 4px 12px rgba(196,168,130,0.25)',
              }"
            >
              <el-icon :size="18">
                <component
                  :is="m.role === 'user' ? 'UserFilled' : 'ChatDotRound'"
                />
              </el-icon>
            </div>

            <div>
              <div
                class="msg-bubble px-4 py-3 rounded-2xl text-sm leading-relaxed"
                :class="
                  m.role === 'user'
                    ? 'msg-bubble-user rounded-br-md text-white'
                    : 'msg-bubble-ai rounded-bl-md'
                "
                :style="
                  m.role === 'user'
                    ? {
                        background:
                          'linear-gradient(135deg,var(--green),var(--green-deep))',
                      }
                    : {
                        background: '#fff',
                        color: 'var(--brown)',
                        border: '1px solid #f0ece4',
                        borderLeft: '4px solid var(--green-mist)',
                      }
                "
              >
                <template v-if="m.role === 'user'">
                  <div
                    v-if="m.type === 'image'"
                    class="flex items-center gap-2"
                  >
                    <el-icon :size="18"><Picture /></el-icon>
                    <span>{{ m.content }}</span>
                  </div>
                  <div v-else>{{ m.content }}</div>
                </template>

                <!-- AI 消息：使用 sanitize 净化后渲染 -->
                <div
                  v-else
                  class="markdown-body"
                  v-html="sanitize(md.render(m.content))"
                ></div>
              </div>

              <div
                v-if="m.role === 'assistant' && m.content"
                class="msg-actions flex gap-1 mt-1.5 ml-1 opacity-0 hover:opacity-100 transition-opacity duration-200"
              >
                <el-tooltip content="语音播放" placement="top">
                  <button class="msg-action-btn" @click="playTTS(m.content)">
                    <el-icon :size="13"><Service /></el-icon>
                  </button>
                </el-tooltip>
                <el-tooltip content="复制" placement="top">
                  <button class="msg-action-btn" @click="copyText(m.content)">
                    <el-icon :size="13"><CopyDocument /></el-icon>
                  </button>
                </el-tooltip>
              </div>
            </div>
          </div>
        </transition-group>

        <!-- ====== 诊断结果卡片 ====== -->
        <div
          v-if="diagnosisResult"
          class="diagnosis-card max-w-[82%] ml-12 mb-6 p-5 rounded-2xl bg-white border border-[#f0ece4]"
          style="box-shadow: 0 4px 24px rgba(26, 74, 46, 0.06)"
        >
          <div
            class="flex items-center justify-between mb-3 pb-3 border-b border-[#f0ece4]"
          >
            <span
              class="font-bold text-sm flex items-center gap-2"
              style="color: var(--brown)"
            >
              <span class="text-lg">🔬</span> 图片诊断结果
            </span>
            <button
              class="text-xs px-3 py-1 rounded-full transition-colors hover:bg-red-50 hover:text-red-500 cursor-pointer"
              style="color: #999"
              @click="diagnosisResult = null"
            >
              关闭
            </button>
          </div>
          <div
            class="text-sm leading-relaxed mb-4 p-3 rounded-xl"
            style="background: #f9f6f0; color: var(--brown-soft)"
          >
            {{ diagnosisResult.summary }}
          </div>
          <div
            v-for="(r, ri) in diagnosisResult.results || []"
            :key="r.filename"
            class="diagnosis-item p-4 rounded-xl mb-2"
            style="
              background: #faf8f4;
              border: 1px solid #f0ece4;
              animation: diagnosisFadeIn 0.4s ease forwards;
            "
            :style="{ animationDelay: 0.1 * ri + 's' }"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="font-semibold text-sm" style="color: var(--brown)">{{
                r.filename
              }}</span>
              <span
                v-if="r.severity"
                class="severity-tag text-xs px-2 py-0.5 rounded-full font-medium"
                :class="{
                  'severity-mild':
                    r.severity === '轻微' || r.severity === 'mild',
                  'severity-medium':
                    r.severity === '中等' || r.severity === 'medium',
                  'severity-severe':
                    r.severity === '严重' || r.severity === 'severe',
                }"
                >{{ r.severity }}</span
              >
            </div>
            <div class="text-sm" style="color: var(--brown-soft)">
              {{ r.diagnosis || r.error || "无诊断结果" }}
            </div>
            <div v-if="r.confidence" class="mt-2 flex items-center gap-2">
              <span class="text-xs" style="color: var(--brown-faint)"
                >置信度</span
              >
              <div
                class="flex-1 h-1.5 rounded-full bg-[#f0ece4] overflow-hidden max-w-[160px]"
              >
                <div
                  class="h-full rounded-full transition-all duration-700"
                  style="background: var(--green)"
                  :style="{ width: r.confidence * 100 + '%' }"
                ></div>
              </div>
              <span class="text-xs font-mono" style="color: var(--brown-faint)"
                >{{ (r.confidence * 100).toFixed(1) }}%</span
              >
            </div>
            <div
              v-if="r.advice"
              class="text-xs mt-2 flex items-start gap-1"
              style="color: var(--green)"
            >
              <span>💡</span><span>{{ r.advice }}</span>
            </div>
          </div>
        </div>

        <!-- ====== 流式输出 ====== -->
        <div v-if="chat.isStreaming" class="flex gap-3 mb-6 max-w-[82%]">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style="
              background: linear-gradient(
                135deg,
                var(--earth-light),
                var(--earth)
              );
              color: var(--brown-soft);
              box-shadow: 0 4px 12px rgba(196, 168, 130, 0.25);
            "
          >
            <el-icon :size="18"><ChatDotRound /></el-icon>
          </div>
          <div
            class="px-4 py-3 rounded-2xl rounded-bl-md text-sm"
            style="
              background: #fff;
              border: 1px solid #f0ece4;
              border-left: 4px solid var(--green-mist);
            "
          >
            <div
              class="markdown-body"
              v-html="sanitize(md.render(streamText))"
            ></div>
            <span class="streaming-cursor"></span>
          </div>
        </div>

        <div ref="$bottom"></div>
      </div>

      <!-- ====== 输入区 ====== -->
      <div
        class="input-area shrink-0 px-4 md:px-10 pb-6 pt-4 bg-white/95 backdrop-blur"
        style="
          border-top: 1px solid #e8e0d4;
          box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.04);
        "
      >
        <transition name="preview-fade">
          <div
            v-if="previewImage"
            class="preview-bar flex items-center gap-3 mb-3 p-3 rounded-2xl"
            style="background: #f8f6f2; border: 1px solid #e8e0d4"
          >
            <div class="w-14 h-14 rounded-xl overflow-hidden shrink-0 img-zoom">
              <img
                :src="previewImage"
                class="w-full h-full object-cover"
                alt="预览"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p
                class="text-xs font-medium truncate"
                style="color: var(--brown)"
              >
                图片诊断模式
              </p>
              <p class="text-[11px]" style="color: var(--brown-faint)">
                AI 将自动分析作物图片并给出诊断
              </p>
            </div>
            <button
              class="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500"
              style="color: #999"
              @click="clearPreview"
            >
              <el-icon :size="14"><Close /></el-icon>
            </button>
          </div>
        </transition>

        <div
          class="input-box flex items-end gap-3 p-3 rounded-2xl border-2 transition-all duration-300"
          style="background: #f8f6f2; border-color: #e8e0d4"
          :class="{ 'input-focused': focused }"
        >
          <div class="flex items-center gap-1 shrink-0">
            <el-tooltip content="上传图片诊断" placement="top">
              <button
                class="func-btn"
                :class="{ 'func-btn-active': previewImage }"
                @click="$refs.imgInput.click()"
              >
                <el-icon :size="18"><Picture /></el-icon>
              </button>
            </el-tooltip>
            <input
              ref="imgInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onImagePick"
            />

            <el-tooltip
              :content="recording ? '点击停止' : '语音输入'"
              placement="top"
            >
              <button
                class="func-btn"
                :class="{ 'func-btn-recording': recording }"
                @click="toggleRec"
              >
                <el-icon :size="18"><Microphone /></el-icon>
              </button>
            </el-tooltip>

            <el-tooltip content="上传音频文件" placement="top">
              <button class="func-btn" @click="$refs.audioInput.click()">
                <el-icon :size="18"><Headset /></el-icon>
              </button>
            </el-tooltip>
            <input
              ref="audioInput"
              type="file"
              accept="audio/*,.m4a,.mp3,.wav"
              class="hidden"
              @change="onAudioPick"
            />
          </div>

          <textarea
            ref="$input"
            v-model="text"
            placeholder="输入您的农业问题，Enter 发送"
            rows="1"
            class="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed chat-textarea"
            style="
              color: var(--brown);
              max-height: 120px;
              font-size: 16px;
              padding-top: 6px;
            "
            @focus="focused = true"
            @blur="focused = false"
            @keydown.enter.exact.prevent="send()"
            @input="autoResize"
            :disabled="chat.isStreaming"
          ></textarea>

          <button
            v-if="chat.isStreaming"
            class="send-btn send-btn-stop shrink-0"
            @click="
              abort?.abort();
              chat.isStreaming = false;
            "
          >
            <el-icon :size="18"><Close /></el-icon>
          </button>
          <button
            v-else
            :disabled="!text.trim() && !previewImage"
            class="send-btn shrink-0"
            :class="{ 'send-btn-disabled': !text.trim() && !previewImage }"
            @click="send()"
          >
            <el-icon :size="18"><Promotion /></el-icon>
          </button>
        </div>

        <p class="text-center text-[11px] mt-2 opacity-30">
          AI回答仅供参考 · 支持农业技术问答、病虫害诊断、种植方案推荐
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from "vue";
import { useChatStore } from "@/stores/chat";
import { chatStream, fetchSessions, fetchSessionMessages } from "@/api/chat";
import { diagnoseImage, voiceToText, textToSpeech } from "@/api/multimodal";
import { ElMessage } from "element-plus";
import {
  Plus,
  Delete,
  DArrowLeft,
  DArrowRight,
  Microphone,
  Close,
  Promotion,
  ChatDotRound,
  UserFilled,
  Picture,
  Headset,
  Service,
  CopyDocument,
} from "@element-plus/icons-vue";
import { formatDate } from "@/utils/format";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

// ---------- Markdown 配置 ----------
const md = new MarkdownIt({
  html: true, // 允许解析 HTML 标签（如 <details>）
  breaks: true,
  linkify: true,
  highlight: (s, l) =>
    l && hljs.getLanguage(l) ? hljs.highlight(s, { language: l }).value : "",
});

// ---------- DOMPurify 净化配置 ----------
const sanitize = (html) =>
  DOMPurify.sanitize(html, {
    ADD_TAGS: ["details", "summary"],
    ADD_ATTR: ["open"],
  });

// ---------- 状态 ----------
const chat = useChatStore();
const text = ref("");
const streamText = ref("");
const sidebar = ref(true);
const recording = ref(false);
const focused = ref(false);
const $input = ref(null);
const $msgArea = ref(null);
const $bottom = ref(null);
const previewImage = ref("");
const pendingImage = ref(null);
const diagnosisResult = ref(null);
let abort = null;
let mediaRecorder = null;
let mediaStream = null;

const quick = [
  "水稻稻瘟病怎么防治？",
  "川南适合种什么柑橘？",
  "一亩水稻成本多少？",
  "夏季茶叶如何修剪？",
];

// ===== 工具函数 =====
function autoResize() {
  const el = $input.value;
  if (el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }
}
function startNew() {
  chat.newConv();
}
function scrollDown() {
  nextTick(() => {
    $bottom.value?.scrollIntoView({ behavior: "smooth" });
  });
}

// ===== 发送消息 =====
async function send(q) {
  const msg = (q || text.value).trim();
  if (!msg && !pendingImage.value) return;
  if (chat.isStreaming) return;

  if (pendingImage.value) {
    await doDiagnose();
    return;
  }

  diagnosisResult.value = null;

  if (!q) text.value = "";
  if ($input.value) $input.value.style.height = "auto";

  if (!chat.currentId) chat.newConv();

  const conv = chat.conversations.find((c) => c.id === chat.currentId);
  const sessionId = conv?.session_id || null;

  chat.addMsg("user", msg);
  chat.addMsg("assistant", "");
  chat.isStreaming = true;
  streamText.value = "";
  abort = new AbortController();
  scrollDown();

  try {
    const res = await chatStream(msg, sessionId, abort.signal);
    if (!res.ok) {
      let errMsg = `请求失败 (${res.status})`;
      try {
        const data = await res.json();
        errMsg = data?.msg || data?.detail || errMsg;
      } catch { /* 忽略非 JSON 响应 */ }
      throw new Error(errMsg);
    }
    if (!res.body) throw new Error('响应为空');
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "",
      full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const d = JSON.parse(line);
          if (d.chunk) {
            full += d.chunk;
            streamText.value = full;
            chat.appendLast(d.chunk);
          }
          if (d.session_id) {
            chat.updateSessionId(d.session_id);
          }
        } catch {
          /* ignore parse errors */
        }
      }
      scrollDown();
    }
    streamText.value = "";
  } catch (err) {
    if (err.name !== "AbortError") ElMessage.error("对话失败：" + err.message);
  } finally {
    chat.isStreaming = false;
    abort = null;
    scrollDown();
  }
}

// ===== 图片诊断 =====
function onImagePick(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  pendingImage.value = file;
  previewImage.value = URL.createObjectURL(file);
  e.target.value = "";
}
async function doDiagnose() {
  if (!pendingImage.value) return;
  chat.isStreaming = true;
  const file = pendingImage.value;
  clearPreview();
  chat.addMsg("user", `[图片诊断] ${file.name}`, { type: "image" });
  try {
    const r = await diagnoseImage(file);
    diagnosisResult.value = r;
    chat.addMsg(
      "assistant",
      `🔬 图片诊断完成，共分析 ${r.total} 张图片。\n\n${r.summary}`,
    );
    if (r.results?.length) {
      const detail = r.results
        .map(
          (res, i) =>
            `**${i + 1}. ${res.filename}**\n- 诊断：${res.diagnosis || "无法识别"}\n- 严重程度：${res.severity || "未知"}\n- 置信度：${res.confidence ? (res.confidence * 100).toFixed(1) + "%" : "未知"}\n- 建议：${res.advice || "无"}`,
        )
        .join("\n\n");
      chat.appendLast("\n\n" + detail);
    }
  } catch (e) {
    ElMessage.error("诊断失败：" + (e.message || "未知错误"));
    chat.addMsg("assistant", "⚠️ 图片诊断失败，请重试。");
  } finally {
    chat.isStreaming = false;
    scrollDown();
  }
}
function clearPreview() {
  if (previewImage.value) URL.revokeObjectURL(previewImage.value);
  previewImage.value = "";
  pendingImage.value = null;
}

// ===== 音频 =====
async function toggleRec() {
  if (recording.value) {
    recording.value = false;
    if (mediaRecorder && mediaRecorder.state !== "inactive")
      mediaRecorder.stop();
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
    return;
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(mediaStream);
    const chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      recording.value = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
      }
      if (!chunks.length) return;
      const blob = new Blob(chunks, { type: "audio/webm" });
      try {
        const r = await voiceToText(new File([blob], "recording.webm"));
        text.value = r.text || r;
        autoResize();
      } catch {
        ElMessage.warning("语音识别失败");
      }
    };
    mediaRecorder.start();
    recording.value = true;
  } catch {
    ElMessage.warning("无法访问麦克风");
  }
}
async function onAudioPick(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = "";
  try {
    const r = await voiceToText(file);
    const t = r.text || r;
    if (t) {
      text.value = t;
      autoResize();
    } else ElMessage.warning("音频识别结果为空");
  } catch {
    ElMessage.warning("音频识别失败");
  }
}

// ===== TTS =====
let currentAudio = null;
async function playTTS(content) {
  try {
    const cleanText = content.replace(/<[^>]*>/g, "").slice(0, 500);
    const r = await textToSpeech(cleanText);
    if (r?.audio_base64) {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
      const audio = new Audio(
        "data:audio/" + (r.format || "mp3") + ";base64," + r.audio_base64,
      );
      currentAudio = audio;
      audio.play().catch(() => ElMessage.warning("播放失败"));
      audio.onended = () => {
        currentAudio = null;
      };
    } else {
      ElMessage.warning("语音合成失败");
    }
  } catch {
    ElMessage.warning("语音合成失败");
  }
}

// ===== 复制 =====
async function copyText(content) {
  try {
    const clean = content.replace(/<[^>]*>/g, "");
    await navigator.clipboard.writeText(clean);
    ElMessage.success("已复制");
  } catch {
    ElMessage.warning("复制失败");
  }
}

// ===== 从服务端加载会话历史 =====
async function loadServerSession() {
  try {
    const sessions = await fetchSessions(50, 0)
    if (sessions?.length) {
      for (const s of sessions) {
        const messages = await fetchSessionMessages(s.id)
        if (messages?.length) {
          chat.hydrateFromServer(s.id, s.title, messages)
        }
      }
      // 默认选中最新会话
      const latest = sessions[0]
      const conv = chat.conversations.find(c => c.session_id === latest.id)
      if (conv) chat.switchConversation(conv.id)
    }
  } catch { /* 静默失败 */ }
}

// ===== 生命周期 =====
watch(() => chat.currentId, scrollDown);
onMounted(async () => {
  // 先从服务器加载，再 fallback 到本地会话
  await loadServerSession()
  if (!chat.currentId && chat.conversations.length)
    chat.currentId = chat.conversations[0].id;
});
</script>

<style scoped>
/* ===== 欢迎区域 ===== */
.welcome-area {
  min-height: calc(100vh - 220px);
}
.welcome-content {
  animation: welcomeFadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.welcome-glow {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(232, 245, 233, 0.7) 0%,
    rgba(232, 245, 233, 0.2) 40%,
    transparent 70%
  );
  pointer-events: none;
  z-index: -1;
}
@keyframes welcomeFadeIn {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.quick-btn {
  animation: quickFloat 4s ease-in-out infinite;
  background: #fff;
}
.quick-btn:hover {
  background: var(--green-mist);
  border-color: var(--green) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(45, 122, 74, 0.12);
}
@keyframes quickFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.msg-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.msg-leave-active {
  transition: all 0.25s ease-in;
}
.msg-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.msg-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.msg-bubble {
  word-break: break-word;
  transition: box-shadow 0.3s ease;
}
.msg-bubble-user {
  border-radius: 20px 20px 6px 20px;
}
.msg-bubble-ai {
  border-radius: 6px 20px 20px 20px;
}
.msg-item:hover .msg-bubble {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.msg-avatar {
  transition: transform 0.3s ease;
}
.msg-item:hover .msg-avatar {
  transform: scale(1.05);
}

.msg-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  background: transparent;
  color: #bbb;
  transition: all 0.2s;
}
.msg-action-btn:hover {
  background: #e8f5e9;
  color: var(--green);
}

.streaming-cursor {
  display: inline-block;
  width: 3px;
  height: 18px;
  margin-left: 2px;
  vertical-align: text-bottom;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--green), var(--gold));
  animation: cursorBlink 1s infinite;
}
@keyframes cursorBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

.input-focused {
  border-color: var(--green) !important;
  box-shadow:
    0 0 0 3px rgba(45, 122, 74, 0.1),
    0 0 20px rgba(45, 122, 74, 0.06) !important;
}
.chat-textarea {
  font-family: "Noto Sans SC", system-ui, sans-serif;
}

.func-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  background: transparent;
  color: #999;
  transition: all 0.2s;
}
.func-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--green);
}
.func-btn-active {
  color: var(--green) !important;
  background: var(--green-mist);
}
.func-btn-recording {
  color: #dc2626 !important;
  background: rgba(220, 38, 38, 0.08);
  animation: recPulse 1.5s ease-in-out infinite;
}
@keyframes recPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.3);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
  }
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, var(--green), var(--green-deep));
  color: #fff;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.send-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(45, 122, 74, 0.3);
}
.send-btn:active {
  transform: scale(0.95);
}
.send-btn-disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.send-btn-disabled:hover {
  transform: none;
  box-shadow: none;
}
.send-btn-stop {
  background: #dc2626;
}
.send-btn-stop:hover {
  background: #b91c1c;
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);
}

.preview-fade-enter-active {
  transition: all 0.3s ease;
}
.preview-fade-leave-active {
  transition: all 0.2s ease;
}
.preview-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.preview-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.chat-session-item {
  background: transparent;
}
.chat-session-item:hover {
  background: rgba(245, 237, 224, 0.5);
}
.session-active {
  background: rgba(232, 245, 233, 0.7) !important;
}

@keyframes diagnosisFadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.severity-tag.severity-mild {
  background: #d1fae5;
  color: #059669;
}
.severity-tag.severity-medium {
  background: #fef3c7;
  color: #d97706;
}
.severity-tag.severity-severe {
  background: #fee2e2;
  color: #dc2626;
}

/* ===== Markdown 内容样式 ===== */
.markdown-body p {
  margin-bottom: 6px;
}
.markdown-body p:last-child {
  margin-bottom: 0;
}
.markdown-body code {
  background: #f0ece4;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 13px;
}
.markdown-body pre {
  background: #f8f6f2;
  padding: 12px 16px;
  border-radius: 10px;
  overflow-x: auto;
  margin: 8px 0;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
}
.markdown-body ul,
.markdown-body ol {
  padding-left: 20px;
  margin: 6px 0;
}
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}
.markdown-body th,
.markdown-body td {
  border: 1px solid #e8e0d4;
  padding: 6px 12px;
  text-align: left;
}
.markdown-body th {
  background: #f8f6f2;
  font-weight: 600;
}

/* ===== 折叠面板 (details/summary) 样式 ===== */
.markdown-body details {
  margin: 8px 0;
  padding: 8px 12px;
  background: #f8f6f2;
  border-radius: 8px;
  border: 1px solid #e8e0d4;
}
.markdown-body details summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--green);
  transition: color 0.2s;
}
.markdown-body details summary:hover {
  color: var(--green-deep);
  text-decoration: underline;
}
.markdown-body details[open] summary {
  margin-bottom: 6px;
}
</style>
