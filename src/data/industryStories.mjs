const stories = [
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
