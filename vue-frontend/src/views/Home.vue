<template>
  <div>
    <!-- ====== Hero 全屏大图区 ====== -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
      <!-- 背景图片轮播 -->
      <div class="absolute inset-0">
        <div v-for="(img, idx) in heroImages" :key="idx" class="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out" :style="{ opacity: currentHero === idx ? 1 : 0 }">
          <img :src="img" alt="川南农业风光" class="w-full h-full object-cover ken-burns" />
        </div>
        <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(26,74,46,0.72) 0%,rgba(22,40,55,0.45) 35%,rgba(45,122,74,0.38) 60%,rgba(26,74,46,0.65) 100%)"></div>
        <div class="absolute inset-0" style="background:radial-gradient(ellipse at 30% 25%,rgba(232,184,75,0.12) 0%,transparent 60%)"></div>
      </div>
      <div class="absolute top-1/5 left-1/5 w-[500px] h-[500px] rounded-full bg-[#E8B84B]/8 blur-[120px] floating" style="animation-duration:7s"></div>
      <div class="absolute top-2/5 right-1/5 w-[400px] h-[400px] rounded-full bg-[#4CAF50]/10 blur-[100px] floating-delay"></div>
      <div class="absolute bottom-1/5 left-1/3 w-[350px] h-[350px] rounded-full bg-white/[0.04] blur-[90px] floating-delay-2"></div>
      <div class="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/8 text-white/85 text-sm mb-10 border border-white/8 backdrop-blur-md reveal-scale">
          <AgriIcons name="chat" :size="14" color="white" /> AI赋能川南农业
        </div>
        <h1 class="text-white text-5xl md:text-7xl font-black mb-5 tracking-widest leading-tight font-['Noto_Serif_SC']">
          <span v-for="(char, ci) in '川农智伴'.split('')" :key="ci" class="inline-block hero-char" :style="{ animationDelay: (0.15 * ci) + 's' }">{{ char }}</span>
        </h1>
        <div class="relative inline-block mb-4">
          <p class="text-2xl md:text-3xl text-white/78 font-['Noto_Serif_SC'] font-light tracking-[0.3em]">多模态AI农业智能体</p>
          <div class="gold-line mt-3 mx-auto"></div>
        </div>
        <p class="text-white/55 text-base md:text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          基于大语言模型与多模态技术，为川南地区提供<br class="hidden md:block" />
          智能问答、作物诊断、种植匹配等全方位AI服务
        </p>
        <div class="flex items-center justify-center gap-5 flex-wrap mb-16">
          <router-link to="/chat" class="hero-btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-full bg-white text-[#1A4A2E] font-bold text-base no-underline transition-all duration-300">
            <AgriIcons name="chat" :size="18" color="#1A4A2E" /> 开始智能问答
            <span class="btn-glow"></span>
          </router-link>
          <a href="#features" class="hero-btn-secondary inline-flex items-center gap-2 px-10 py-4 rounded-full border border-white/25 text-white/85 font-medium text-base no-underline hover:bg-white/8 transition-all duration-300 group">
            了解更多 <el-icon :size="16" class="transition-transform duration-300 group-hover:translate-x-1"><ArrowDown /></el-icon>
          </a>
        </div>
        <div ref="$stats" class="stats-card inline-flex items-center justify-center gap-10 px-10 py-6 rounded-2xl bg-white/4 border border-white/8 backdrop-blur-md mx-auto reveal-scale">
          <div class="text-center"><span class="block text-3xl font-bold text-white font-mono tracking-tight">{{ animated.users.toLocaleString() }}</span><span class="text-xs text-white/50 mt-1 block">注册用户</span></div>
          <div class="w-px h-12 bg-white/8"></div>
          <div class="text-center"><span class="block text-3xl font-bold text-white font-mono tracking-tight">{{ animated.knowledge.toLocaleString() }}</span><span class="text-xs text-white/50 mt-1 block">知识条目</span></div>
          <div class="w-px h-12 bg-white/8"></div>
          <div class="text-center"><span class="block text-3xl font-bold text-white font-mono tracking-tight">{{ animated.news.toLocaleString() }}</span><span class="text-xs text-white/50 mt-1 block">农业资讯</span></div>
        </div>
      </div>
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/40">
        <span class="text-xs tracking-widest">向下滚动</span>
        <div class="scroll-indicator w-5 h-8 rounded-full border border-white/25 flex items-start justify-center p-1">
          <div class="w-1.5 h-1.5 rounded-full bg-white/60 scroll-dot"></div>
        </div>
      </div>
    </section>

    <section id="features" class="py-28 px-6 relative" style="background:linear-gradient(180deg,var(--cream) 0%,#F9F5EF 100%)">
      <div class="absolute inset-0 opacity-[0.03]" style="background-image:radial-gradient(circle,var(--brown) 1px,transparent 1px);background-size:24px 24px"></div>
      <div class="max-w-6xl mx-auto relative z-10">
        <div ref="$featureTitle" class="text-center mb-16 reveal">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium" style="background:var(--green-mist);color:var(--green)">
            <AgriIcons name="leaf" :size="14" color="#2D7A4A" /> 核心功能
          </div>
          <h2 class="font-['Noto_Serif_SC'] text-4xl md:text-5xl font-bold mt-5" style="color:var(--green-deep)">七大AI能力</h2>
          <p class="mt-4 text-lg" style="color:var(--brown-faint)">覆盖农业生产全流程的智能化解决方案</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div v-for="(f, i) in features.slice(0, 2)" :key="i" ref="$featureCards" class="feature-card group p-10 rounded-3xl bg-white border border-[#e8e0d4] hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden reveal" :style="{ '--card-color': f.color, animationDelay: (0.1 * i) + 's' }">
            <div class="feature-bar" :style="{ background: f.color }"></div>
            <div class="feature-side-bar"></div>
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:rotate-[360deg] group-hover:invert group-hover:hue-rotate-180" :style="{background:f.bg, color:f.color}">
              <AgriIcons :name="f.icon" :size="28" :color="f.color" />
            </div>
            <h3 class="font-['Noto_Serif_SC'] text-xl font-bold mb-3" style="color:var(--brown)">{{ f.title }}</h3>
            <p class="text-sm leading-relaxed" style="color:var(--brown-faint)">{{ f.desc }}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="(f, i) in features.slice(2)" :key="i + 2" ref="$featureCards2" class="feature-card group p-7 rounded-2xl bg-white border border-[#e8e0d4] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden reveal" :style="{ '--card-color': f.color, animationDelay: (0.1 * (i + 2)) + 's' }">
            <div class="feature-bar" :style="{ background: f.color }"></div>
            <div class="feature-side-bar"></div>
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:rotate-[360deg] group-hover:invert group-hover:hue-rotate-180" :style="{background:f.bg, color:f.color}">
              <AgriIcons :name="f.icon" :size="22" :color="f.color" />
            </div>
            <h3 class="font-['Noto_Serif_SC'] text-base font-bold mb-2" style="color:var(--brown)">{{ f.title }}</h3>
            <p class="text-xs leading-relaxed" style="color:var(--brown-faint)">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section ref="$kgSection" class="py-28 px-6 relative overflow-hidden" style="background:linear-gradient(180deg,#F9F5EF 0%,var(--cream) 100%)">
      <div class="absolute inset-0 opacity-[0.04]" style="background-image:radial-gradient(circle,#0F766E 1px,transparent 1px);background-size:22px 22px"></div>
      <div class="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div ref="$kgTitle" class="reveal">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium" style="background:#CCFBF1;color:#0F766E">
            <AgriIcons name="graph" :size="14" color="#0F766E" /> 知识图谱
          </div>
          <h2 class="font-['Noto_Serif_SC'] text-3xl md:text-4xl font-bold mt-4" style="color:var(--green-deep)">把复杂的农技关系，画成一张清晰的图</h2>
          <p class="mt-4 leading-relaxed" style="color:var(--brown-faint)">平台内置病害、症状、作物、药物与购买渠道五类实体，用关系图谱展示“什么病、什么症状、用什么药、哪里买”的完整链路。</p>
          <div class="grid sm:grid-cols-2 gap-3 mt-6">
            <div v-for="(point, pi) in kgPoints" :key="pi" class="kg-point p-4 rounded-2xl bg-white/80 border border-[#e8e0d4] flex items-start gap-3">
              <span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{background:point.bg, color:point.color}">
                <AgriIcons :name="point.icon" :size="16" :color="point.color" />
              </span>
              <div>
                <h3 class="text-sm font-bold" style="color:var(--brown)">{{ point.title }}</h3>
                <p class="text-xs mt-1 leading-relaxed" style="color:var(--brown-faint)">{{ point.desc }}</p>
              </div>
            </div>
          </div>
          <router-link to="/knowledge-graph" class="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl text-white font-semibold no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl" style="background:linear-gradient(135deg,#0F766E,#2D7A4A);box-shadow:0 8px 24px rgba(15,118,110,0.2)">
            <AgriIcons name="graph" :size="17" color="white" /> 进入知识图谱
          </router-link>
        </div>
        <div ref="$kgMedia" class="relative reveal">
          <div class="absolute -inset-3 rounded-3xl opacity-20 blur-2xl" style="background:linear-gradient(135deg,#0F766E,#34D399)"></div>
          <img src="/images/knowledge-graph.png" alt="川农智伴知识图谱界面" class="relative w-full h-auto rounded-2xl border border-[#e8e0d4] shadow-2xl" loading="lazy" />
        </div>
      </div>
    </section>
    <section class="py-28 px-6 bg-white relative overflow-hidden">
      <div class="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#E8F5E9]/30 blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
      <div class="max-w-6xl mx-auto relative z-10">
        <div ref="$sceneTitle" class="text-center mb-16 reveal">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium" style="background:var(--green-mist);color:var(--green)">
            <AgriIcons name="camera" :size="14" color="#2D7A4A" /> 应用场景
          </div>
          <h2 class="font-['Noto_Serif_SC'] text-4xl font-bold mt-4" style="color:var(--green-deep)">科技赋能农业生产</h2>
          <p class="mt-3" style="color:var(--brown-faint)">从田间到云端，AI全程守护川南农业</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="(scene, i) in scenes" :key="i" ref="$sceneCards" class="scene-card group rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-[#e8e0d4] hover:border-[var(--scene-color)] reveal" :style="{ '--scene-color': scene.color, transform: i % 2 === 1 ? 'translateY(30px)' : 'translateY(0)', animationDelay: (0.12 * i) + 's' }">
            <div class="relative h-60 overflow-hidden">
              <img :src="scene.img" :alt="scene.title" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115" loading="lazy" style="filter: brightness(0.92)" />
              <div class="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/20 to-transparent translate-y-1/4 group-hover:translate-y-0 transition-transform duration-500 flex items-end p-6">
                <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  <p class="text-white/90 text-xs leading-relaxed line-clamp-2">{{ scene.desc }}</p>
                </div>
              </div>
            </div>
            <div class="p-6 bg-white">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :style="{background:scene.bg, color:scene.color}">
                  <AgriIcons :name="scene.icon" :size="18" :color="scene.color" />
                </div>
                <h3 class="font-['Noto_Serif_SC'] font-bold text-lg" style="color:var(--brown)">{{ scene.title }}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="relative h-80 overflow-hidden">
      <img src="https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1920&q=80" alt="晨雾梯田" class="absolute inset-0 w-full h-full object-cover ken-burns" style="filter:brightness(0.35)" loading="lazy" />
      <div class="absolute inset-0 flex items-center justify-center" style="background:linear-gradient(180deg,rgba(26,74,46,0.5),rgba(26,74,46,0.7))">
        <div class="text-center text-white px-6">
          <p class="text-xl md:text-3xl font-['Noto_Serif_SC'] font-light tracking-[0.2em] reveal-scale">用AI的力量，守护每一寸土地</p>
          <div class="relative mt-6 flex justify-center"><div class="h-px bg-[#E8B84B] gold-divider-extend mx-auto"></div></div>
        </div>
      </div>
    </div>

    <section class="py-28 px-6" style="background:linear-gradient(180deg,var(--cream),#F9F5EF)">
      <div class="max-w-5xl mx-auto">
        <div ref="$stepTitle" class="text-center mb-20 reveal">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium" style="background:var(--green-mist);color:var(--green)">
            <AgriIcons name="sprout" :size="14" color="#2D7A4A" /> 使用流程
          </div>
          <h2 class="font-['Noto_Serif_SC'] text-4xl font-bold mt-4" style="color:var(--green-deep)">简单三步，开始智慧农业</h2>
        </div>
        <div class="hidden md:flex items-start justify-center gap-0">
          <div v-for="(s, si) in steps" :key="si" ref="$stepCards" class="step-item flex-1 max-w-xs text-center relative reveal" :style="{ animationDelay: (0.2 * si) + 's' }">
            <div class="relative mb-6">
              <div v-if="si < steps.length - 1" class="absolute top-5 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5" style="background:linear-gradient(90deg,var(--green),var(--green-light));overflow:hidden">
                <div class="h-full w-full arrow-flow" style="background:linear-gradient(90deg,transparent,var(--gold),transparent);animation:arrowFlow 2s linear infinite"></div>
              </div>
              <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto text-white font-bold text-lg relative z-10 transition-all duration-300 hover:scale-125" style="background:var(--green)">{{ si + 1 }}</div>
            </div>
            <div class="p-7 rounded-2xl bg-white border border-[#e8e0d4] hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
              <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" :style="{background:s.bg, color:s.color}">
                <AgriIcons :name="s.icon" :size="24" :color="s.color" />
              </div>
              <h3 class="font-['Noto_Serif_SC'] font-bold text-lg mb-2" style="color:var(--brown)">{{ s.title }}</h3>
              <p class="text-sm leading-relaxed" style="color:var(--brown-faint)">{{ s.desc }}</p>
            </div>
          </div>
        </div>
        <div class="md:hidden space-y-0">
          <div v-for="(s, si) in steps" :key="'m'+si" class="step-item flex gap-5 pb-10 relative">
            <div class="flex flex-col items-center shrink-0">
              <div class="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold relative z-10" style="background:var(--green)">{{ si + 1 }}</div>
              <div v-if="si < steps.length - 1" class="w-0.5 flex-1 mt-1" style="background:linear-gradient(180deg,var(--green-light),transparent)"></div>
            </div>
            <div class="flex-1 pb-4">
              <div class="p-6 rounded-2xl bg-white border border-[#e8e0d4]">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center" :style="{background:s.bg, color:s.color}">
                    <AgriIcons :name="s.icon" :size="18" :color="s.color" />
                  </div>
                  <h3 class="font-['Noto_Serif_SC'] font-bold" style="color:var(--brown)">{{ s.title }}</h3>
                </div>
                <p class="text-sm" style="color:var(--brown-faint)">{{ s.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="relative py-32 px-6 overflow-hidden">
      <div class="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80" alt="日出田野" class="w-full h-full object-cover ken-burns" loading="lazy" />
        <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(26,74,46,0.88),rgba(22,40,55,0.6),rgba(26,74,46,0.82))"></div>
        <div class="absolute inset-0" style="background:radial-gradient(ellipse at center,rgba(232,184,75,0.1),transparent 70%)"></div>
      </div>
      <div class="relative z-10 max-w-2xl mx-auto text-center">
        <h2 class="font-['Noto_Serif_SC'] text-3xl md:text-4xl font-bold mb-4 text-white cta-breathing">准备好开始智慧农业了吗？</h2>
        <p class="text-white/75 mb-10 text-lg">免费注册，即刻体验AI驱动的农业智能服务</p>
        <div class="flex items-center justify-center gap-5 flex-wrap">
          <router-link to="/register" class="cta-btn-cta inline-flex items-center gap-2 px-10 py-4 rounded-full bg-white text-[#1A4A2E] font-bold no-underline transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 relative overflow-hidden">
            <span class="relative z-10 flex items-center gap-2"><AgriIcons name="user" :size="18" color="#1A4A2E" /> 免费注册</span>
          </router-link>
          <router-link to="/chat" class="cta-btn-cta inline-flex items-center gap-2 px-10 py-4 rounded-full border border-white/25 text-white font-medium no-underline hover:bg-white/8 transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
            <span class="relative z-10 flex items-center gap-2"><AgriIcons name="chat" :size="18" color="white" /> 体验问答</span>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted, nextTick } from 'vue'
import AgriIcons from '@/components/icons/AgriIcons.vue'

const features = [
  { icon: 'chat', title: '智能问答', desc: '基于RAG技术的农业知识问答，精准回答水稻、柑橘、茶叶等各类农技问题', bg: '#E8F5E9', color: '#2D7A4A' },
  { icon: 'book', title: '农技知识库', desc: '海量农技知识资源，覆盖种植、养殖、畜牧等领域，支持智能RAG检索', bg: '#F5EDE0', color: '#C4A882' },
  { icon: 'camera', title: '图片诊断', desc: '上传作物图片，AI自动识别病虫害，并提供专业防治建议', bg: '#DBEAFE', color: '#3B82F6' },
  { icon: 'sprout', title: '种植匹配', desc: '根据地区、季节和农业类型，智能推荐最适合的种植方案', bg: '#FCE7F3', color: '#EC4899' },
  { icon: 'chart', title: '收益计算', desc: '科学计算种植成本与收益，辅助决策，实现精准农业管理', bg: '#E0E7FF', color: '#6366F1' },
  { icon: 'graph', title: '知识图谱', desc: '将病害、症状、用药与购买渠道的关系可视化，一次点击看清完整防治链路', bg: '#F0FDF4', color: '#0F766E' },
  { icon: 'news', title: '农业资讯', desc: '实时获取最新农业政策、市场行情和行业动态，把握发展先机', bg: '#D1FAE5', color: '#10B981' }
]

const kgPoints = [
  { icon: 'graph', title: '关系可视化', desc: '病害、症状、用药与购买渠道关系一目了然', bg: '#CCFBF1', color: '#0F766E' },
  { icon: 'camera', title: '节点详情', desc: '点击任意节点查看描述、用法与关联实体', bg: '#DBEAFE', color: '#2563EB' },
  { icon: 'sprout', title: '智能搜索', desc: '输入作物或症状关键词快速定位图谱节点', bg: '#D1FAE5', color: '#059669' },
  { icon: 'chart', title: '路径查询', desc: '查看任意两个实体之间的完整关系路径', bg: '#FEF3C7', color: '#D97706' }
]

const scenes = [
  { img: '/images/水稻种植.jpg', title: '水稻种植', icon: 'rice', bg: '#E8F5E9', color: '#2D7A4A', desc: 'AI智能识别稻瘟病、纹枯病等常见病害，精准推荐防治方案，保障水稻丰收' },
  { img: '/images/柑橘果园.jpg', title: '柑橘果园', icon: 'leaf', bg: '#FEF3C7', color: '#D97706', desc: '基于多模态技术分析柑橘叶片和果实状态，提供施肥、修剪、病虫害管理建议' },
  { img: '/images/茶叶种植.jpg', title: '茶叶种植', icon: 'leaf', bg: '#D1FAE5', color: '#059669', desc: '结合川南茶区气候数据，优化采摘时机与养护方案，提升茶叶品质与产量' },
  { img: '/images/蔬菜大棚.jpg', title: '蔬菜大棚', icon: 'sprout', bg: '#FCE7F3', color: '#DB2777', desc: '智能监测大棚温湿度与光照条件，自动调节环境参数，实现精准设施农业' },
  { img: '/images/畜牧养殖.jpg', title: '畜牧养殖', icon: 'home', bg: '#EDE9FE', color: '#7C3AED', desc: 'AI监测牲畜健康状况，智能分析饲喂数据，提升养殖效率和动物福利' },
  { img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80', title: '智慧农机', icon: 'settings', bg: '#DBEAFE', color: '#2563EB', desc: '连接智能农机设备，实时监控作业状态，数据驱动农业机械化高效生产' }
]

const steps = [
  { icon: 'user', title: '注册账号', desc: '手机号快速注册，即刻开启AI农业服务', bg: '#E8F5E9', color: '#2D7A4A' },
  { icon: 'chat', title: '交互提问', desc: '输入农业问题或上传作物图片，AI即刻响应', bg: '#FEF3C7', color: '#D97706' },
  { icon: 'leaf', title: '获得方案', desc: '获取精准的种植建议、病虫害诊断和收益分析', bg: '#D1FAE5', color: '#059669' }
]

const heroImages = [
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1920&q=80',
  'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1920&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80',
  'https://images.unsplash.com/photo-1492496913980-501348b61469?w=1920&q=80',
  'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1920&q=80',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920&q=80'
]
const currentHero = ref(0)
let heroTimer = null

const animated = reactive({ users: 0, knowledge: 0, news: 0 })
const TARGETS = { users: 1280, knowledge: 560, news: 3200 }
let statsAnimated = false

const $stats = ref(null); const $featureTitle = ref(null)
const $featureCards = ref([]); const $featureCards2 = ref([])
const $sceneTitle = ref(null); const $sceneCards = ref([])
const $stepTitle = ref(null); const $stepCards = ref([])
const $kgTitle = ref(null); const $kgMedia = ref(null)

function animateNumbers(duration = 2500) {
  if (statsAnimated) return
  statsAnimated = true
  const start = performance.now()
  function tick(now) {
    const p = Math.min((now - start) / duration, 1)
    const ease = 1 - Math.pow(1 - p, 3)
    animated.users = Math.floor(TARGETS.users * ease)
    animated.knowledge = Math.floor(TARGETS.knowledge * ease)
    animated.news = Math.floor(TARGETS.news * ease)
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

let observer = null
onMounted(() => {
  heroTimer = setInterval(() => { currentHero.value = (currentHero.value + 1) % heroImages.length }, 8000)
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        if (entry.target === $stats.value) animateNumbers()
        if (!entry.target.classList.contains('keep-observing')) observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
  if ($stats.value) observer.observe($stats.value)
  if ($featureTitle.value) observer.observe($featureTitle.value)
  $featureCards.value.forEach(el => el && observer.observe(el))
  $featureCards2.value.forEach(el => el && observer.observe(el))
  if ($sceneTitle.value) observer.observe($sceneTitle.value)
  $sceneCards.value.forEach(el => el && observer.observe(el))
  if ($stepTitle.value) observer.observe($stepTitle.value)
  $stepCards.value.forEach(el => el && observer.observe(el))
  if ($kgTitle.value) observer.observe($kgTitle.value)
  if ($kgMedia.value) observer.observe($kgMedia.value)
})
onUnmounted(() => { if (heroTimer) clearInterval(heroTimer); if (observer) observer.disconnect() })
</script>

<style scoped>
.hero-char { opacity: 0; animation: charPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; text-shadow: 0 4px 20px rgba(0,0,0,0.3); }
@keyframes charPopIn { 0% { opacity: 0; transform: translateY(40px) scale(0.5); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
.gold-line { width: 0; height: 3px; background: linear-gradient(90deg, transparent, var(--gold), transparent); border-radius: 2px; animation: goldLineExtend 1s cubic-bezier(0.4, 0, 0.2, 1) 0.8s forwards; }
@keyframes goldLineExtend { 0% { width: 0; opacity: 0; } 100% { width: 80px; opacity: 1; } }
.btn-glow { position: absolute; inset: -4px; border-radius: 9999px; background: transparent; animation: btnGlowPulse 2.5s ease-in-out infinite; pointer-events: none; z-index: -1; }
@keyframes btnGlowPulse { 0%, 100% { box-shadow: 0 0 12px rgba(255,255,255,0.5), 0 0 30px rgba(45,122,74,0.2); } 50% { box-shadow: 0 0 24px rgba(255,255,255,0.8), 0 0 50px rgba(45,122,74,0.4); } }
.hero-btn-primary { position: relative; z-index: 1; }
.hero-btn-primary:hover { transform: translateY(-2px); }
.scroll-dot { animation: scrollDotBounce 2s ease-in-out infinite; }
@keyframes scrollDotBounce { 0%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(8px); opacity: 1; } }
.feature-card { --card-color: var(--green); }
.feature-bar { position: absolute; top: 0; left: 0; right: 0; height: 4px; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 0 0 4px 4px; }
.feature-side-bar { position: absolute; left: 0; top: 0; width: 4px; height: 0; transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 0 4px 4px 0; background: var(--card-color); opacity: 0.5; }
.feature-card:hover .feature-bar { height: 6px; opacity: 0.4; }
.feature-card:hover .feature-side-bar { height: 100%; }
.scene-card:hover { border-color: var(--scene-color) !important; }
.scene-card img { transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
.scene-card:hover img { transform: scale(1.15); }
.gold-divider-extend { width: 80px; animation: goldDivExtend 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes goldDivExtend { 0% { width: 0; opacity: 0; } 100% { width: 80px; opacity: 1; } }
@keyframes arrowFlow { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.cta-breathing { animation: ctaTextBreathe 3s ease-in-out infinite; }
@keyframes ctaTextBreathe { 0%, 100% { text-shadow: 0 0 20px rgba(232,184,75,0.2); } 50% { text-shadow: 0 0 40px rgba(232,184,75,0.5), 0 0 60px rgba(45,122,74,0.3); } }
.cta-btn-cta { position: relative; }
.cta-btn-cta::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent); transition: left 0.6s ease; z-index: 0; }
.cta-btn-cta:hover::before { left: 100%; }

.kg-point {
  transition: all 0.3s ease;
}
.kg-point:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15, 118, 110, 0.1);
}
</style>
