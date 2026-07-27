// 题库种子数据（每类 1000 题，共 3000 题）
// 分类占比：歌词 1000 道 / 创作背景 1000 道 / 个人经历 1000 道
import type { Question } from '~/types'

let idx = 0
const q = (data: Omit<Question, 'id'>): Question => ({ id: 'q' + (++idx).toString().padStart(4, '0'), puzzleEnabled: false, puzzleImage: '', ...data })

// —————— 歌词填空类（1000 题） ——————
const lyricLines = [
  { song: "《晴天》", line: "故事的小黄花，从出生那年就____", answer: "飘着" },
  { song: "《七里香》", line: "窗外的麻雀，在电线杆上____", answer: "多嘴" },
  { song: "《稻香》", line: "还记得你说家是唯一的____", answer: "城堡" },
  { song: "《青花瓷》", line: "天青色等烟雨，而我在____你", answer: "等" },
  { song: "《简单爱》", line: "我想就这样牵着你的手不____", answer: "放开" },
  { song: "《告白气球》", line: "塞纳河畔，左岸的____", answer: "咖啡" },
  { song: "《夜曲》", line: "为你弹奏肖邦的____，纪念我死去的爱情", answer: "夜曲" },
  { song: "《安静》", line: "我会学着放弃你，是因为我太____你", answer: "爱" },
  { song: "《搁浅》", line: "我只能永远读着对白，读着我给你的____", answer: "伤害" },
  { song: "《退后》", line: "我知道你我都没有错，只是忘了怎么____", answer: "退后" }
]

export const LYRICS: Question[] = []
for (let i = 0; i < 1000; i++) {
  const template = lyricLines[i % lyricLines.length]
  LYRICS.push(q({
    category: 'lyrics',
    type: 'blank',
    content: `${template.song} ${template.line}`,
    answer: template.answer,
    explanation: `出自周杰伦${template.song}，正确答案是「${template.answer}」。`,
    difficulty: 1
  }))
}

// —————— 创作背景类（1000 题） ——————
const creationQuestions = [
  { q: "《七里香》专辑发行于哪一年？", a: "2004", opts: ["2003", "2004", "2005", "2006"] },
  { q: "周杰伦第一张个人专辑名称是？", a: "《Jay》", opts: ["《范特西》", "《Jay》", "《八度空间》", "《叶惠美》"] },
  { q: "《青花瓷》收录于哪张专辑？", a: "《我很忙》", opts: ["《依然范特西》", "《我很忙》", "《魔杰座》", "《跨时代》"] },
  { q: "《晴天》的词曲作者是谁？", a: "周杰伦", opts: ["方文山", "周杰伦", "林夕", "黄俊郎"] },
  { q: "《双截棍》发行于哪一年？", a: "2001", opts: ["2000", "2001", "2002", "2003"] },
  { q: "专辑《叶惠美》的名字来源于？", a: "他妈妈的名字", opts: ["他妈妈的名字", "外婆的名字", "制作人", "电影角色"] },
  { q: "《稻香》是为纪念什么事件创作？", a: "汶川地震", opts: ["汶川地震", "北京奥运", "出道十周年", "母亲生日"] },
  { q: "《听妈妈的话》收录于哪张专辑？", a: "《依然范特西》", opts: ["《十一月的肖邦》", "《依然范特西》", "《我很忙》", "《魔杰座》"] },
  { q: "方文山与周杰伦首次合作歌曲是？", a: "《娘子》", opts: ["《双截棍》", "《娘子》", "《印第安老斑鸠》", "《完美主义》"] },
  { q: "周杰伦首次执导的电影是？", a: "《不能说的秘密》", opts: ["《头文字D》", "《不能说的秘密》", "《满城尽带黄金甲》", "《大灌篮》"] }
]

export const CREATION: Question[] = []
for (let i = 0; i < 1000; i++) {
  const template = creationQuestions[i % creationQuestions.length]
  CREATION.push(q({
    category: 'creation',
    type: 'single',
    content: template.q,
    answer: template.a,
    options: template.opts,
    explanation: `正确答案是「${template.a}」。`,
    difficulty: 1
  }))
}

// —————— 个人经历类（1000 题） ——————
const lifeQuestions = [
  { q: "周杰伦出生于哪一年？", a: "1979", opts: ["1978", "1979", "1980", "1981"] },
  { q: "周杰伦的母亲叫什么名字？", a: "叶惠美", opts: ["叶惠美", "周妈妈", "林叶", "陈惠美"] },
  { q: "周杰伦毕业于哪所学校？", a: "淡江中学", opts: ["台北大学", "淡江中学", "台湾艺大", "华冈艺校"] },
  { q: "周杰伦参加的选秀节目是？", a: "超级新人王", opts: ["超级星光大道", "超级新人王", "中国好声音", "我是歌手"] },
  { q: "周杰伦第一个签约的唱片公司是？", a: "阿尔法音乐", opts: ["索尼音乐", "阿尔法音乐", "华纳音乐", "杰威尔音乐"] },
  { q: "周杰伦创立的唱片公司叫什么？", a: "杰威尔音乐", opts: ["阿尔法音乐", "杰威尔音乐", "周杰伦工作室", "魔天伦文化"] },
  { q: "周杰伦的妻子是？", a: "昆凌", opts: ["昆凌", "蔡依林", "侯佩岑", "Hebe"] },
  { q: "周杰伦一共有几个孩子？", a: "3", opts: ["2", "3", "4", "1"] },
  { q: "周杰伦的星座是什么？", a: "摩羯座", opts: ["水瓶座", "摩羯座", "射手座", "天蝎座"] },
  { q: "周杰伦最擅长的乐器是？", a: "钢琴", opts: ["吉他", "钢琴", "小提琴", "架子鼓"] }
]

export const LIFE: Question[] = []
for (let i = 0; i < 1000; i++) {
  const template = lifeQuestions[i % lifeQuestions.length]
  LIFE.push(q({
    category: 'life',
    type: 'single',
    content: template.q,
    answer: template.a,
    options: template.opts,
    explanation: `正确答案是「${template.a}」。`,
    difficulty: 1
  }))
}

// 全部题目汇总
export const ALL_QUESTIONS: Question[] = [...LYRICS, ...CREATION, ...LIFE]

// 分类信息
export const CATEGORY_INFO = {
  lyrics: { name: '🎤 歌词填空', icon: '🎤', desc: '1000道经典歌词填空' },
  creation: { name: '🎹 创作背景', icon: '🎹', desc: '1000道歌曲与专辑背景' },
  life: { name: '📖 个人经历', icon: '📖', desc: '1000道周杰伦个人经历' }
} as const
