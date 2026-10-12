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
        class="flex items-center justify-between p-5 border-b shrink-0 gap-2"
        style="border-color: rgba(232, 224, 212, 0.5)"
      >
        <h3
          class="font-['Noto_Serif_SC'] font-bold text-sm tracking-wide"
          style="color: var(--brown)"
        >
          对话历史
        </h3>
        <div class="flex items-center gap-1.5 shrink-0">
          <el-tooltip content="收起历史列表" placement="bottom">
            <button
              class="sidebar-toggle-btn"
              aria-label="收起历史列表"
              @click="toggleSidebar"
            >
              <el-icon :size="15"><DArrowLeft /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip content="新建对话" placement="bottom">
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90 hover:scale-110 cursor-pointer"
              style="background: var(--green-mist); color: var(--green)"
              aria-label="新建对话"
              @click="startNew"
            >
              <el-icon :size="16"><Plus /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-2">
        <div
          v-for="c in chat.conversations"
          :key="c.id"
          class="chat-session-item group flex items-center gap-2 px-3 py-3 rounded-xl cursor-pointer mb-1 transition-all duration-200 relative overflow-hidden"
          :class="[c.id === chat.currentId ? 'session-active' : '', c.loadError ? 'session-error' : '']"
          @click="openSession(c)"
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

          <!-- 标题 + 发起时间：时间用会话的 createdAt（服务端真值优先） -->
          <div class="flex-1 min-w-0">
            <div
              class="truncate text-sm font-medium"
              :style="{
                color:
                  c.id === chat.currentId
                    ? 'var(--green-deep)'
                    : 'var(--brown-soft)',
              }"
              :title="c.title"
            >
              {{ c.title }}
            </div>
            <div class="text-[10px] mt-0.5 truncate" style="color: #bbb">
              <span :title="'发起时间：' + (c.createdAt || '—')">
                发起 {{ formatDate(c.createdAt, "MM/DD HH:mm") }}
              </span>
              <span v-if="c.loadError" style="color: #dc2626"> · 加载失败</span>
            </div>
          </div>

          <!-- 重命名 -->
          <button
            class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
            style="background: rgba(14, 122, 68, 0.1); color: var(--green)"
            title="重命名"
            @click.stop="startRename(c)"
          >
            <el-icon :size="12"><EditPen /></el-icon>
          </button>

          <!-- 删除 -->
          <button
            class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
            style="background: rgba(220, 38, 38, 0.08); color: #dc2626"
            title="删除"
            @click.stop="handleDelete(c)"
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

      <!-- 侧边栏收起后的悬浮展开按钮：比贴边的细条更好发现 -->
      <el-tooltip v-if="!sidebar" content="展开对话历史" placement="right">
        <button
          class="sidebar-edge-btn is-collapsed"
          aria-label="展开对话历史"
          @click="toggleSidebar"
        >
          <el-icon :size="15"><DArrowRight /></el-icon>
          <span class="sidebar-edge-text">历史</span>
        </button>
      </el-tooltip>

      <button
        v-else
        class="sidebar-edge-btn"
        title="收起对话历史"
        aria-label="收起对话历史"
        @click="toggleSidebar"
      >
        <el-icon :size="16"><DArrowLeft /></el-icon>
      </button>
    </aside>

    <!-- ====== 主区域 ====== -->
    <div class="flex-1 flex flex-col min-w-0 relative">
      <!-- 底部留白给输入卡片的渐隐带：pb-16 保证最后一条回答能滚到渐隐带之上 -->
      <div ref="$msgArea" class="flex-1 overflow-y-auto px-4 md:px-10 pt-8 pb-16">
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
                text-shadow: 0 2px 12px rgba(10, 92, 51, 0.08);
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
                box-shadow: 0 8px 32px rgba(10, 92, 51, 0.04);
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

        <!--
          对话流居中定宽容器：最大宽度 850px 并水平居中。
          回答态的所有内容（消息列表、诊断卡片、流式块、滚动锚点）都挂在这一层内。
          必须有这一层：旧实现直接给 AI 气泡加 max-w-[82%]，宽度基数是被拉伸到满屏的
          滚动容器，于是宽屏上单行文本过长、窄屏上又被压得过窄，两种屏都读着累。
        -->
        <div class="chat-stream mx-auto w-full max-w-[850px]">
        <!-- ====== 消息列表 ====== -->
        <transition-group name="msg" tag="div">
          <div
            v-for="(m, i) in chat.currentMessages"
            :key="i"
            class="flex gap-3 mb-6 msg-item"
            :class="m.role === 'user' ? 'flex-row-reverse' : ''"
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
                    ? '0 4px 12px rgba(14,122,68,0.25)'
                    : '0 4px 12px rgba(196,168,130,0.25)',
              }"
            >
              <el-icon :size="18">
                <component
                  :is="m.role === 'user' ? 'UserFilled' : 'ChatDotRound'"
                />
              </el-icon>
            </div>

            <!--
              用户侧靠右并限宽（长问题不横贯整屏）；AI 侧占满 850px 内容列 —— 回答是主体。
              卡片的排版参数（内边距/字号/行高/阴影）统一收敛到 .msg-bubble-ai，
              这里不再有「白底 + 1px 边框 + 4px 左侧粗绿边」的三重边框叠罗汉。
            -->
            <div
              class="msg-col min-w-0 flex-1"
              :class="m.role === 'user' ? 'flex flex-col items-end' : ''"
            >
              <div
                class="msg-bubble rounded-2xl"
                :class="
                  m.role === 'user'
                    ? 'msg-bubble-user rounded-br-md text-white px-4 py-3 text-sm leading-relaxed max-w-[85%]'
                    : 'msg-bubble-ai rounded-bl-md w-full'
                "
                :style="
                  m.role === 'user'
                    ? {
                        background:
                          'linear-gradient(135deg,var(--green),var(--green-deep))',
                      }
                    : { background: '#fff', color: 'var(--brown)' }
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

                <!--
                  AI 消息渲染链：Markdown → 关键实体高亮 → DOMPurify 净化。
                  顺序不能变：高亮必须在净化之前（净化后标签已定型），
                  且必须对 Markdown 渲染结果做（正文里才有 <p>/<table> 等结构）。
                -->
                <div
                  v-else
                  class="markdown-body"
                  v-html="renderAnswer(m.content, msgPayload(m))"
                ></div>
              </div>

              <!--
                回答操作栏：复制 · 语音朗读（播放/暂停 + 波纹）· 重新生成 · 赞/踩。
                抽成组件是因为它自带播放状态机与复制降级，留在页面里会让本文件继续膨胀；
                messageKey 用「下标 + 内容前 32 字」——同一条消息稳定，重生成后自然会变。
              -->
              <MessageActions
                v-if="m.role === 'assistant' && m.content"
                :text="m.content"
                :speech-text="msgPayload(m).spoken_text || ''"
                :copy-text="copyTextOf(m)"
                :message-key="`${i}-${(m.content || '').slice(0, 32)}`"
                :feedback="m.feedback || null"
                :can-regenerate="i === chat.currentMessages.length - 1"
                :busy="chat.isStreaming"
                @regenerate="regenerate(i)"
                @feedback="(v) => chat.setFeedback(i, v)"
              />

              <!--
                AI 结构化洞察区（阶段 1~5）：
                顺序 置信度 → 智能体链路 → 处方 / 低置信度引导 → 推理链 → 依据来源。
                无 payload 的历史消息整块不渲染，回退为上面的纯 Markdown 气泡。
              -->
              <div
                v-if="m.role === 'assistant' && msgPayload(m)"
                class="ai-insight mt-2 flex flex-col gap-2 min-w-0"
              >
                <ConfidenceTag
                  :level="msgPayload(m).confidence_level"
                  :confidence="msgPayload(m).confidence"
                />
                <AgentTrace
                  v-if="msgPayload(m).agent_trace"
                  :trace="msgPayload(m).agent_trace"
                  :meta="msgPayload(m).source_meta"
                />
                <PrescriptionCard
                  v-if="showPrescription(m)"
                  :prescription="msgPayload(m).prescription"
                  :sources="msgPayload(m).sources"
                  :channels="msgPayload(m).retrieval_channels"
                  :graph-paths="msgPayload(m).graph_paths"
                  :confidence-level="msgPayload(m).confidence_level"
                  :risk-warnings="msgPayload(m).risk_warnings"
                  @node-click="gotoGraph"
                />
                <LowConfidenceGuide
                  v-else-if="showGuide(m)"
                  :need-more-info="msgPayload(m).need_more_info || m.needMoreInfoGuide"
                />
                <ReasoningPanel :chain="msgPayload(m).reasoning_chain" />
                <!-- 有处方时依据已在处方卡片「依据区」呈现，这里只兜无处方的情况，避免重复 -->
                <template v-if="!showPrescription(m)">
                  <GraphPathView
                    v-if="msgPayload(m).graph_paths.length"
                    :paths="msgPayload(m).graph_paths"
                    @node-click="gotoGraph"
                  />
                  <!-- 检索来源：优先按三路通道分组展示（本地知识库/知识图谱/联网搜索） -->
                  <SourceList
                    :sources="msgPayload(m).sources"
                    :channels="msgPayload(m).retrieval_channels"
                    @node-click="gotoGraph"
                  />
                </template>
              </div>
            </div>
          </div>
        </transition-group>

        <!-- ====== 诊断结果卡片 ====== -->
        <div
          v-if="diagnosisResult"
          class="diagnosis-card ml-12 mb-6 p-5 rounded-2xl bg-white"
          style="box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05)"
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
          <div class="flex items-start gap-2 flex-wrap mb-4">
            <div
              class="text-sm leading-relaxed p-3 rounded-xl flex-1 min-w-0"
              style="background: #f9f6f0; color: var(--brown-soft)"
            >
              {{ diagnosisResult.summary }}
            </div>
            <!-- 顶层整体置信度：取所有图片中最差等级，低置信度时处方式建议已被后端拦截 -->
            <ConfidenceTag
              :level="diagnosisResult.overall_confidence_level"
              :confidence="diagnosisResult.overall_confidence"
            />
          </div>
          <!-- 整批低置信度：顶部统一给出补充信息引导 -->
          <LowConfidenceGuide
            v-if="diagnoseBatchGuide"
            class="mb-3"
            :need-more-info="diagnosisResult.need_more_info"
          />
          <div
            v-for="(r, ri) in diagnosisResult.results"
            :key="r.filename + ri"
            class="diagnosis-item p-4 rounded-xl mb-2"
            style="
              background: #faf8f4;
              border: 1px solid #f0ece4;
              animation: diagnosisFadeIn 0.4s ease forwards;
            "
            :style="{ animationDelay: 0.1 * ri + 's' }"
          >
            <div class="flex items-center gap-2 flex-wrap mb-2">
              <span class="font-semibold text-sm break-all" style="color: var(--brown)">{{
                r.filename
              }}</span>
              <span
                v-if="severityClass(r.severity)"
                class="severity-tag text-xs px-2 py-0.5 rounded-full font-medium"
                :class="'severity-' + severityClass(r.severity)"
                >{{ r.severity }}</span
              >
              <ConfidenceTag
                :level="r.confidence_level"
                :confidence="r.confidence"
                size="small"
              />
            </div>
            <div class="text-sm" style="color: var(--brown-soft)">
              {{ r.diagnosis || r.error || "无诊断结果" }}
            </div>
            <!--
              这里原先还有一条「灰底 + 绿条」的置信度进度条，与上面第 452 行的
              ConfidenceTag 表达的是同一个数值，属于重复信息，已删除。
              置信度一律只用徽章口径（ConfidenceTag），全站不再出现进度条。
            -->
            <div
              v-if="r.advice"
              class="text-xs mt-2 flex items-start gap-1"
              style="color: var(--green)"
            >
              <span>💡</span><span>{{ r.advice }}</span>
            </div>
            <div v-if="r.symptoms.length" class="flex items-center gap-1.5 flex-wrap mt-2">
              <span class="text-[11px]" style="color: var(--brown-faint)">观察症状</span>
              <span
                v-for="(s, si) in r.symptoms"
                :key="si"
                class="text-[11px] px-2 py-0.5 rounded-full"
                style="background: #FEF3C7; color: #92400E"
                >{{ s }}</span
              >
            </div>
            <div v-if="r.cause" class="text-[11px] mt-2 leading-relaxed" style="color: var(--brown-soft)">
              诱因：{{ r.cause }}
            </div>

            <!--
              处方 / 低置信度引导二选一：
              低置信度时后端已主动置空处方，这里再做一次前端保险，绝不同时展示。
              不相关图片（is_relevant=false）没有结构化内容，整块不渲染。
            -->
            <div v-if="r.is_relevant" class="mt-3 flex flex-col gap-2">
              <PrescriptionCard
                v-if="diagnoseShowPrescription(r)"
                :prescription="r.prescription"
                :sources="r.sources"
                :graph-paths="r.graph_paths"
                :confidence-level="r.confidence_level"
                :risk-warnings="r.risk_warnings"
                @node-click="gotoGraph"
              />
              <LowConfidenceGuide
                v-else-if="diagnoseShowGuide(r)"
                :need-more-info="r.need_more_info || diagnosisResult.need_more_info"
              />
              <ReasoningPanel :chain="r.reasoning_chain" />
              <template v-if="!diagnoseShowPrescription(r)">
                <GraphPathView
                  v-if="r.graph_paths.length"
                  :paths="r.graph_paths"
                  @node-click="gotoGraph"
                />
                <SourceList :sources="r.sources" @node-click="gotoGraph" />
              </template>
            </div>
          </div>
        </div>

        <!-- ====== 流式输出 ====== -->
        <div v-if="chat.isStreaming" class="flex gap-3 mb-6">
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
          <!-- 与落定后的 AI 卡片同款：流式过程中到结束不跳版 -->
          <div class="msg-bubble msg-bubble-ai rounded-2xl rounded-bl-md w-full">
            <div
              class="markdown-body"
              v-html="renderAnswer(streamText, null)"
            ></div>
            <span class="streaming-cursor"></span>
          </div>
        </div>

        <div ref="$bottom"></div>
        </div>
        <!-- ====== /对话流居中定宽容器 ====== -->
      </div>

      <!-- ====== 输入区 ====== -->
      <!--
        底部输入框已抽成 ChatComposer：纯白大圆角卡片 + 柔和阴影 + :focus-within 主色光晕，
        免责声明移出输入容器、放在卡片正下方居中。
        父组件只留「文本 / 待诊断图片」两条双向绑定与 send / stop 两个事件——
        语音录制、图片预览、高度自适应等录放逻辑全部内聚在组件里。
      -->
      <ChatComposer
        v-model:text="text"
        v-model:image="pendingImage"
        :streaming="chat.isStreaming"
        @send="send()"
        @stop="stopStream()"
      />
    </div>

    <!-- 重命名会话：会话标题由后端持久化，越权会话由后端拒绝 -->
    <el-dialog
      v-model="renameDialog"
      title="修改会话标题"
      width="420px"
      append-to-body
    >
      <div class="mb-2 text-xs" style="color: var(--brown-faint)">
        发起时间：{{ renameTarget?.createdAt || '—' }}
      </div>
      <el-input
        v-model="renameTitle"
        maxlength="50"
        show-word-limit
        placeholder="请输入新的会话标题"
        @keyup.enter="confirmRename"
      />
      <template #footer>
        <el-button @click="renameDialog = false" class="!rounded-xl">取消</el-button>
        <el-button type="primary" :loading="renaming" @click="confirmRename" class="!rounded-xl">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useChatStore } from "@/stores/chat";
import { chatStream } from "@/api/chat";
import { diagnoseImage } from "@/api/multimodal";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Delete,
  EditPen,
  DArrowLeft,
  DArrowRight,
  ChatDotRound,
  UserFilled,
  Picture,
} from "@element-plus/icons-vue";
import { formatDate } from "@/utils/format";
import {
  formatAnswerForCopy,
  formatConfidence,
  normalizeDiagnoseResult,
  severityClass,
  stripRetrievalContainer,
} from "@/utils/aiTypes";
import ConfidenceTag from "@/components/ai/ConfidenceTag.vue";
import PrescriptionCard from "@/components/ai/PrescriptionCard.vue";
import LowConfidenceGuide from "@/components/ai/LowConfidenceGuide.vue";
import ReasoningPanel from "@/components/ai/ReasoningPanel.vue";
import AgentTrace from "@/components/ai/AgentTrace.vue";
import SourceList from "@/components/ai/SourceList.vue";
import GraphPathView from "@/components/ai/GraphPathView.vue";
import MessageActions from "@/components/ai/MessageActions.vue";
import ChatComposer from "@/components/chat/ChatComposer.vue";
import { applyEntityHighlight } from "@/utils/highlightEntities";
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
    // mark 是实体高亮用的标签（DOMPurify 默认白名单里也有，这里显式声明避免将来改配置时被清掉）
    ADD_TAGS: ["details", "summary", "mark"],
    ADD_ATTR: ["open"],
  });

/**
 * 回答正文的完整渲染链：Markdown → 实体高亮 → 净化。
 *
 * 高亮失败必须回退成未高亮的 HTML —— 高亮只是增强，任何情况下都不能让回答白屏。
 * 流式阶段传 null payload：此时还没有拿到结构化载荷，且每来一个 chunk 都要重算一次，
 * 没有词表就直接短路返回，不产生额外开销。
 *
 * 有 payload 时先摘掉正文末尾的「检索来源」容器：同一份源文字由
 * SourceList 组件（可收缩、带匹配度/链接/图谱路径）呈现，
 * 正文里再留一份就是同一屏里展示两遍（流式阶段还没 payload，保留正文里的那份兜底）。
 */
function renderAnswer(content, payload) {
  const channels = payload?.retrieval_channels
  const text = channels?.length ? stripRetrievalContainer(content) : content
  return sanitize(applyEntityHighlight(md.render(text || ""), payload));
}

// ---------- 侧边栏收起状态 ----------
const SIDEBAR_KEY = "cnzb_chat_sidebar_collapsed";

/**
 * 侧边栏展开状态：
 * 窄屏（<1024px）默认收起，否则内容区被挤得太窄；其余情况沿用上次的选择。
 * 状态持久化，避免每次进问答页都要重新收一次。
 */
function loadSidebarPref() {
  try {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved === "1") return false;
    if (saved === "0") return true;
  } catch {
    /* localStorage 不可用时按默认值处理 */
  }
  return typeof window !== "undefined" ? window.innerWidth >= 1024 : true;
}
function toggleSidebar() {
  sidebar.value = !sidebar.value;
  try {
    localStorage.setItem(SIDEBAR_KEY, sidebar.value ? "0" : "1");
  } catch {
    /* 存不进去不影响本次会话内的收起/展开 */
  }
}


// ---------- 状态 ----------
const chat = useChatStore();
const router = useRouter();
const text = ref("");
const streamText = ref("");
const sidebar = ref(loadSidebarPref());
// 输入框状态（recording / focused / $input / previewImage / 自适应高度 / 录放逻辑）
// 已随 ChatComposer.vue 抽走，这里只保留父组件真正需要读写的两项
const $msgArea = ref(null);
const $bottom = ref(null);
/** 待诊断图片：与 ChatComposer 双向绑定，图片预览 URL 由组件自己持有与回收 */
const pendingImage = ref(null);
const diagnosisResult = ref(null);
// 重命名会话
const renameDialog = ref(false);
const renameTitle = ref("");
const renameTarget = ref(null);
const renaming = ref(false);
let abort = null;

const quick = [
  "水稻稻瘟病怎么防治？",
  "川南适合种什么柑橘？",
  "一亩水稻成本多少？",
  "夏季茶叶如何修剪？",
];

// ===== AI 结构化载荷的渲染判定 =====
// store 已保证 payload 是归一化后的形状，这里只做存在性判断，不做二次容错
const msgPayload = (m) => (m && m.payload) || null;

/** 是否需要展示「建议补充信息」引导（低置信度或后端明确要求补充） */
function needsGuide(p) {
  if (!p) return false;
  return p.confidence_level === "low" || !!p.need_more_info;
}

/** 无引导且有处方才渲染处方卡片：低置信度时两者互斥，避免误导用药 */
function showPrescription(m) {
  const p = msgPayload(m);
  return !!p && !!p.prescription && !needsGuide(p);
}
function showGuide(m) {
  return needsGuide(msgPayload(m));
}

// 图片诊断结果逐图判定：只看该图自己的等级，避免一张低置信度把整批处方全砍掉
function diagnoseShowGuide(r) {
  return r.confidence_level === "low" || !!r.need_more_info;
}
function diagnoseShowPrescription(r) {
  return !!r.prescription && !diagnoseShowGuide(r);
}

/** 整批图片是否处于低置信度（顶部整体引导） */
const diagnoseBatchGuide = computed(
  () =>
    !!diagnosisResult.value &&
    (diagnosisResult.value.overall_confidence_level === "low" ||
      !!diagnosisResult.value.need_more_info),
);

/** 点击图谱节点跳转到知识图谱页并按节点高亮 */
function gotoGraph(node) {
  if (!node || !node.name) return;
  router.push({ path: "/knowledge-graph", query: { highlight: node.name, type: node.type } });
}

function startNew() {
  // 每次「新建对话」都开一个空白会话，不继承任何历史消息
  chat.newConversation();
  diagnosisResult.value = null;
  text.value = "";
  // 置空即清预览：ChatComposer 的 watch 会 revoke 掉 objectURL
  pendingImage.value = null;
  scrollDown();
}

// ===== 会话列表操作 =====
/**
 * 点击左侧会话：拉取该会话的消息并整段替换。
 * 切换会话只换 currentId，消息来自各会话自己的 messages 数组，因此不会串台。
 */
async function openSession(conv) {
  if (chat.isStreaming) {
    ElMessage.warning("正在回答中，请稍候再切换会话");
    return;
  }
  try {
    await chat.openSession(conv.id);
    scrollDown();
  } catch {
    ElMessage.error("会话内容加载失败，请重试");
  }
}

function startRename(conv) {
  renameTarget.value = conv;
  renameTitle.value = conv.title || "";
  renameDialog.value = true;
}

async function confirmRename() {
  const title = (renameTitle.value || "").trim();
  if (!title) {
    ElMessage.warning("标题不能为空");
    return;
  }
  if (!renameTarget.value) return;
  renaming.value = true;
  try {
    await chat.renameConversation(renameTarget.value.id, title);
    ElMessage.success("标题已更新");
    renameDialog.value = false;
  } catch {
    ElMessage.error("标题保存失败，已还原");
  } finally {
    renaming.value = false;
  }
}

async function handleDelete(conv) {
  try {
    await ElMessageBox.confirm(
      `确定删除会话「${conv.title}」？删除后该会话不再出现在列表中。`,
      "删除确认",
      { type: "warning", confirmButtonText: "确定删除", cancelButtonText: "取消" },
    );
  } catch {
    return; // 用户取消
  }
  try {
    await chat.deleteConversation(conv.id);
    ElMessage.success("已删除");
  } catch {
    ElMessage.error("删除失败，请重试");
  }
}

/**
 * 滚到消息区底部。
 *
 * 只用**消息区自身**的 scrollTop，不用 `scrollIntoView`：
 * 后者会连带把整个窗口滚下去，于是"一进问答页就跳到了网页最底部"。
 * 另外空会话（刚进入页面、还没有消息）根本不需要滚动，直接跳过。
 */
function scrollDown(force = false) {
  nextTick(() => {
    const el = $msgArea.value;
    if (!el) return;
    if (!force && !chat.currentMessages.length) return;
    el.scrollTop = el.scrollHeight;
  });
}

// ===== 发送消息 =====
/**
 * @param {string} [q] 问题文本；省略时取输入框内容
 * @param {{appendUser?: boolean}} [opts]
 *   appendUser=false 供「重新生成」使用：提问已经在会话里了，
 *   再 addMsg 一次会在同一轮里出现两条一样的用户消息。
 */
async function send(q, opts = {}) {
  const { appendUser = true } = opts;
  const msg = (q || text.value).trim();
  if (!msg && !pendingImage.value) return;
  if (chat.isStreaming) return;

  if (pendingImage.value) {
    await doDiagnose();
    return;
  }

  diagnosisResult.value = null;

  if (!q) text.value = "";

  if (!chat.currentId) chat.newConversation();

  const conv = chat.conversations.find((c) => c.id === chat.currentId);
  // 只有服务端已确认的会话才带 session_id；草稿会话传 null，后端会**新建**会话，
  // 因此不会把新问题插进上一次对话里。
  const sessionId = conv?.session_id || null;

  if (appendUser) chat.addMsg("user", msg);
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
            // 后端在未带 session_id 时一律新建会话，new_session 用于确认这一点
            chat.updateSessionId(d.session_id);
          }
          // 末行的结构化载荷（api_version 2 新增）；未知键一律忽略，保证前向兼容
          if (d.payload) {
            chat.updateLastPayload(d.payload);
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
// 选图、预览、录制、识别全部在 ChatComposer 内部完成，
// 这里只消费它同步过来的 pendingImage 并跑诊断。
async function doDiagnose() {
  if (!pendingImage.value) return;
  chat.isStreaming = true;
  const file = pendingImage.value;
  // 置空即清预览：ChatComposer 的 watch 会负责 revoke 掉 objectURL
  pendingImage.value = null;
  chat.addMsg("user", `[图片诊断] ${file.name}`, { type: "image" });
  try {
    const raw = await diagnoseImage(file);
    // 多模态返回同样带 api_version 2 增量字段，统一归一化后再交给卡片渲染
    const r = normalizeDiagnoseResult(raw);
    diagnosisResult.value = r;
    chat.addMsg(
      "assistant",
      `🔬 图片诊断完成，共分析 ${r.total} 张图片。\n\n${r.summary}`,
    );
    if (r.results?.length) {
      const detail = r.results
        .map(
          (res, i) =>
            `**${i + 1}. ${res.filename}**\n- 诊断：${res.diagnosis || "无法识别"}\n- 严重程度：${res.severity || "未知"}\n- 置信度：${formatConfidence(res.confidence) || res.confidence_label || "未知"}\n- 建议：${res.advice || "无"}`,
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

/** 停止流式回答：中断请求并把流式态复位（旧实现是模板里的内联语句，无法复用） */
function stopStream() {
  if (abort) {
    abort.abort();
    abort = null;
  }
  chat.isStreaming = false;
}

// ===== 复制 / 重新生成 =====
/**
 * 复制到剪贴板的文本：正文 + 处方/风险/依据。
 * 只复制正文会得到一个缺了用法用量和成本的半截答案，粘到微信里没法用；
 * 无 payload 的历史消息由 formatAnswerForCopy 原样返回正文，行为与旧版一致。
 */
function copyTextOf(m) {
  return formatAnswerForCopy(m.content, msgPayload(m));
}

/**
 * 重新生成：重发该回答对应的上一条用户提问。
 *
 * 三步顺序不能反：
 *   1. 先定位提问（在目标回答之前最近的一条 user 消息，图片诊断轮次跳过）；
 *   2. 再摘掉最后一条 assistant 消息 —— 必须在发请求之前，否则新回答会追加在旧回答后面；
 *   3. 最后以 appendUser:false 重跑 send，只补一条 assistant 占位并重新走流式。
 * 中间轮次不允许重生成（会丢掉后续对话），由 MessageActions 的 canRegenerate 拦在前面。
 */
async function regenerate(index) {
  if (chat.isStreaming) return;
  const msgs = chat.currentMessages;
  let question = "";
  for (let i = index - 1; i >= 0; i--) {
    if (msgs[i].role === "user" && msgs[i].type !== "image") {
      question = msgs[i].content || "";
      break;
    }
  }
  if (!question) {
    ElMessage.warning("这一轮是图片诊断，请重新上传图片");
    return;
  }
  if (!chat.dropLastAssistant()) {
    ElMessage.warning("只能对最后一条回答重新生成");
    return;
  }
  await send(question, { appendUser: false });
}

// ===== 会话列表加载 =====
/**
 * 只加载**当前用户**的会话列表（不预取任何消息）。
 *
 * 旧实现会把每个会话的消息全部预取，并默认选中最近一个会话，
 * 于是用户每次进入智能问答都直接看到上一次的对话，拿不到干净的上下文。
 * 现在改为：列表照常展示，但默认停在**一个全新的空白会话**上，
 * 历史会话只有用户主动点击时才拉取消息。
 */
async function loadSessionList() {
  try {
    await chat.loadSessionList(50);
  } catch {
    /* 拉取失败时保留本地缓存列表，用户在页面上仍能看到自己上次的会话 */
  }
}

// ===== 生命周期 =====
// 只在「消息数量变化」时滚动：currentId 变化（新建会话）不该把页面滚下去
watch(() => chat.currentMessages.length, () => scrollDown());
// 流式追加时也要跟随，但仅在已有内容时
watch(streamText, () => {
  if (chat.isStreaming) scrollDown();
});
onMounted(async () => {
  // 账号可能在本次挂载前被切换过，先按当前登录用户重置一次，避免看到上一个用户的会话
  chat.resetForUser();
  await loadSessionList();
  // 关键：进入页面即进入全新对话，不自动选中历史会话。
  // newConversation 会复用「一条消息都没发过」的草稿，因此反复进出不会堆出一串空会话。
  chat.newConversation();
  // 不调用 scrollDown()：空会话没有内容可滚，调用它只会把视口带到底部
  // （旧实现用 scrollIntoView 还会连带滚动整个窗口，用户进来就看到页面最下方）
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
  box-shadow: 0 4px 16px rgba(14, 122, 68, 0.12);
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
/*
 * AI 回答卡片：纯白底 + 大圆角 + 常驻柔和阴影，**没有边框**。
 * 旧实现是「1px 浅褐边框 + 4px 左侧粗绿边 + hover 才出的阴影」，
 * 边框把卡片切得很硬，而阴影只在鼠标悬停时出现，触屏上等于没有层次。
 */
.msg-bubble-ai {
  border-radius: 6px 20px 20px 20px;
  padding: 18px 20px;
  font-size: 15px;
  line-height: 1.6;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
/* 悬停只做「微微抬起」，不改变卡片本该有的层次（否则又变成 hover 才有阴影） */
.msg-bubble-ai:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
}
.msg-item:hover .msg-bubble-user {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
/* 用户消息的操作栏在 AI 侧，这条列容器只保证 AI 卡片能吃满 850px 内容列 */
.msg-col {
  min-width: 0;
}
.msg-avatar {
  transition: transform 0.3s ease;
}
.msg-item:hover .msg-avatar {
  transform: scale(1.05);
}

/* 旧的操作栏按钮样式（.msg-action-btn）已随 MessageActions.vue 抽出，此处不再保留 */

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

/*
 * 输入区相关样式（.input-focused / .chat-textarea / .func-btn* / .send-btn* / .preview-fade-*）
 * 已随输入框一起搬进 components/chat/ChatComposer.vue，此处不再保留。
 * 唯一有行为差异的一处：聚焦态由 JS 的 focused 状态改成 CSS :focus-within，
 * 因此点击左侧工具按钮时不会再把聚焦光环闪掉。
 */

.chat-session-item {
  background: transparent;
}
.chat-session-item:hover {
  background: rgba(245, 237, 224, 0.5);
}
.session-active {
  background: rgba(232, 245, 233, 0.7) !important;
}
/* 会话消息拉取失败：给出视觉提示，避免用户以为会话是空的 */
.session-error {
  background: rgba(254, 226, 226, 0.4) !important;
}

/* ===== 侧边栏收起 / 展开 ===== */
/* 贴边的细条按钮：展开时在侧边栏右缘，收起时贴在页面左缘 */
.sidebar-edge-btn {
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(6px);
  border: 1px solid #e8e0d4;
  border-left: none;
  border-radius: 0 12px 12px 0;
  color: #999;
  cursor: pointer;
  z-index: 10;
  transition: color 0.2s, background 0.2s;
}
.sidebar-edge-btn:hover {
  color: var(--green);
  background: #fff;
}
/* 收起状态下按钮贴在页面左边缘，加宽并带上"历史"字样，比一条无色细条好发现 */
.sidebar-edge-btn.is-collapsed {
  width: 34px;
  right: -34px;
  border-left: 1px solid #e8e0d4;
  color: var(--green);
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 2px 0 10px rgba(10, 92, 51, 0.08);
}
.sidebar-edge-text {
  font-size: 10px;
  line-height: 1;
  writing-mode: vertical-rl;
}
/* 侧边栏标题栏内的收起按钮：比边缘细条更直观 */
.sidebar-toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2efe9;
  color: var(--brown-soft);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.sidebar-toggle-btn:hover {
  background: var(--green-mist);
  color: var(--green);
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

/*
 * ===== Markdown 内容样式 =====
 *
 * 这里原本有 65 行 .markdown-body * 规则，**已全部删除并搬到 assets/styles/main.css**。
 * 原因是 scoped 样式对 v-html 内容无效：编译器把 `.markdown-body p` 变成
 * `.markdown-body p[data-v-xxx]`，而 v-html 注入的节点没有 data-v 属性
 * （Vue runtime 对 innerHTML 只做 `el.innerHTML = value`，不注入 scopeId），
 * 于是那 65 行一直是死代码——AI 回答正文至今用的是浏览器默认排版。
 * 搬到全局后排版才真正生效，实体高亮（.markdown-body mark.entity）也才能落到 mark 标签上。
 */
</style>
