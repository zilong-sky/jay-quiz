import { defineEventHandler } from 'h3'
import { ok } from '~/server/utils/response'
import { kv } from '~/server/utils/kv'
import type { Question } from '~/types'

// 歌词填空模板
const lyricsTemplates = [
  { prefix: "《七里香》", content: "窗外的____在电线杆上多嘴", answer: "麻雀" },
  { prefix: "《晴天》", content: "从前从前有个人爱你____", answer: "很久" },
  { prefix: "《稻香》", content: "还记得你说家是唯一的____", answer: "城堡" },
  { prefix: "《青花瓷》", content: "天青色等____而我在等你", answer: "烟雨" },
  { prefix: "《告白气球》", content: "亲爱的爱上你从那天起，甜蜜的很____", answer: "轻易" },
  { prefix: "《简单爱》", content: "我想就这样牵着你的手不____", answer: "放开" },
  { prefix: "《安静》", content: "我会学着放弃你，是因为我太____你", answer: "爱" },
  { prefix: "《搁浅》", content: "我只能永远读着对白，读着我给你的____", answer: "伤害" },
  { prefix: "《以父之名》", content: "我们每个人都有罪，犯着不同的____", answer: "罪" },
  { prefix: "《夜曲》", content: "为你弹奏肖邦的____，纪念我死去的爱情", answer: "夜曲" }
]

// 创作背景模板
const creationTemplates = [
  { content: "《七里香》的专辑发行于哪一年？", answer: "2004", options: ["2003", "2004", "2005", "2006"] },
  { content: "周杰伦的第一张个人专辑是？", answer: "《Jay》", options: ["《范特西》", "《Jay》", "《八度空间》", "《叶惠美》"] },
  { content: "《青花瓷》收录于哪张专辑？", answer: "《我很忙》", options: ["《依然范特西》", "《我很忙》", "《魔杰座》", "《跨时代》"] },
  { content: "《晴天》的作词作曲是谁？", answer: "周杰伦", options: ["方文山", "周杰伦", "林夕", "黄俊郎"] },
  { content: "《双截棍》发行于哪一年？", answer: "2001", options: ["2000", "2001", "2002", "2003"] },
  { content: "周杰伦专辑《叶惠美》的名字来源于？", answer: "他妈妈的名字", options: ["他妈妈的名字", "他外婆的名字", "专辑制作人", "电影角色名"] },
  { content: "《稻香》是为了纪念什么事件创作的？", answer: "汶川地震", options: ["汶川地震", "北京奥运", "出道十周年", "母亲生日"] },
  { content: "《听妈妈的话》收录于哪张专辑？", answer: "《依然范特西》", options: ["《十一月的肖邦》", "《依然范特西》", "《我很忙》", "《魔杰座》"] },
  { content: "方文山和周杰伦第一次合作的歌曲是？", answer: "《娘子》", options: ["《双截棍》", "《娘子》", "《印第安老斑鸠》", "《完美主义》"] },
  { content: "周杰伦担任导演的第一部电影是？", answer: "《不能说的秘密》", options: ["《头文字D》", "《不能说的秘密》", "《满城尽带黄金甲》", "《大灌篮》"] }
]

// 个人经历模板
const lifeTemplates = [
  { content: "周杰伦出生于哪一年？", answer: "1979", options: ["1978", "1979", "1980", "1981"] },
  { content: "周杰伦的母亲叫什么名字？", answer: "叶惠美", options: ["叶惠美", "周妈妈", "林叶", "陈惠美"] },
  { content: "周杰伦毕业于哪所学校？", answer: "淡江中学", options: ["台北大学", "淡江中学", "台湾艺术大学", "华冈艺校"] },
  { content: "周杰伦参加的选秀节目是？", answer: "超级新人王", options: ["超级星光大道", "超级新人王", "中国好声音", "我是歌手"] },
  { content: "周杰伦第一个签约的唱片公司是？", answer: "阿尔法音乐", options: ["索尼音乐", "阿尔法音乐", "华纳音乐", "杰威尔音乐"] },
  { content: "周杰伦创立的唱片公司叫什么？", answer: "杰威尔音乐", options: ["阿尔法音乐", "杰威尔音乐", "周杰伦工作室", "魔天伦文化"] },
  { content: "周杰伦的妻子是？", answer: "昆凌", options: ["昆凌", "蔡依林", "侯佩岑", "Hebe"] },
  { content: "周杰伦有几个孩子？", answer: "3", options: ["2", "3", "4", "1"] },
  { content: "周杰伦的星座是什么？", answer: "摩羯座", options: ["水瓶座", "摩羯座", "射手座", "天蝎座"] },
  { content: "周杰伦最擅长的乐器是？", answer: "钢琴", options: ["吉他", "钢琴", "小提琴", "架子鼓"] }
]

function generateQuestions(): Question[] {
  const questions: Question[] = []
  let id = 1

  // 生成1000道歌词填空题
  for (let i = 0; i < 1000; i++) {
    const template = lyricsTemplates[i % lyricsTemplates.length]
    questions.push({
      id: `lyrics_${String(id).padStart(4, '0')}`,
      type: 'blank',
      category: 'lyrics',
      content: `${template.prefix} ${i + 1}: ${template.content}`,
      answer: template.answer,
      difficulty: 1,
      explanation: `${template.prefix}经典歌词，正确答案是「${template.answer}」`,
      sort: id,
      puzzleEnabled: false,
      puzzleImage: ''
    })
    id++
  }

  // 生成1000道创作背景题
  for (let i = 0; i < 1000; i++) {
    const template = creationTemplates[i % creationTemplates.length]
    questions.push({
      id: `creation_${String(id).padStart(4, '0')}`,
      type: 'choice',
      category: 'creation',
      content: `${i + 1}. ${template.content}`,
      answer: template.answer,
      options: [...template.options],
      difficulty: 1,
      explanation: `正确答案是「${template.answer}」`,
      sort: id,
      puzzleEnabled: false,
      puzzleImage: ''
    })
    id++
  }

  // 生成1000道个人经历题
  for (let i = 0; i < 1000; i++) {
    const template = lifeTemplates[i % lifeTemplates.length]
    questions.push({
      id: `life_${String(id).padStart(4, '0')}`,
      type: 'choice',
      category: 'life',
      content: `${i + 1}. ${template.content}`,
      answer: template.answer,
      options: [...template.options],
      difficulty: 1,
      explanation: `正确答案是「${template.answer}」`,
      sort: id,
      puzzleEnabled: false,
      puzzleImage: ''
    })
    id++
  }

  return questions
}

export default defineEventHandler(async () => {
  const questions = generateQuestions()

  // 清空旧数据
  const oldIndex = await kv.get<string[]>('db:questions:index') || []
  for (const id of oldIndex) {
    await kv.del(`db:questions:item:${id}`)
  }

  // 写入新数据
  const index = questions.map(q => q.id)
  for (const q of questions) {
    await kv.set(`db:questions:item:${q.id}`, q)
  }
  await kv.set('db:questions:index', index)

  // 清除旧的混合顺序，让它重新生成
  await kv.del('db:questions:mixed-order')

  return {
    success: true,
    total: questions.length,
    message: `已成功生成 ${questions.length} 道题目（歌词1000道，创作背景1000道，个人经历1000道）`
  }
})
