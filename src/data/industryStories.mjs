const stories = [
  {
    slug: 'shenzhen-commercial-space-cluster',
    href: '/industry/shenzhen-commercial-space-cluster',
    publishedAt: '2026-08-02',
    title: '深圳商业航天产业集群全景｜从火箭到卫星的深圳力量',
    summary: '商业航天纳入国家战略性新兴产业，深圳以"20+8"产业集群重点培育，从宝安到罗湖、从卫星制造到火箭发射，正构建"箭—星—网"全链条商业航天生态。',
    label: '深度专题',
  },
  {
    slug: 'deepseek-open-source-llm-vision',
    href: '/industry/deepseek-open-source-llm-vision',
    publishedAt: '2026-08-02',
    title: '从 DeepSeek 看开源大模型发展愿景｜梁文峰投资者交流会精华',
    summary: '梁文峰 2026 年 5 月首轮投资者交流会精华：AGI 终极愿景、开源与商业模式共存逻辑、AI 发展五级阶梯路线图，以及国产芯片生态的历史性判断。',
    label: '深度专题',
  },
  {
    slug: 'byd-strategy',
    href: '/industry/byd-strategy',
    publishedAt: '2026-07-28',
    title: '比亚迪战略全景｜从电池厂到全球科技帝国的「四化」征途',
    summary: '从电动化、智能化、高端化到全球化，梳理比亚迪的战略全景与工程师文化。',
    label: '深度专题',
  },
];

export function getIndustryStories() {
  return [...stories].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}
