import type { Metadata } from 'next';

import pkg from '../../../../package.json';

const brandName =
  pkg.seo?.title?.split('—')[0]?.trim() ?? pkg.name ?? 'Admin Template';
const platformName = `${brandName} 平台`;
const companyName = 'VOH 科技有限公司';
const officialSite =
  process.env.NEXT_PUBLIC_SITE_URL ?? pkg.seo?.og?.url ?? 'https://admin.com';

const updatedDate = '2022年07月06日';
const effectiveDate = '2022年07月06日';

type ParagraphBlock = {
  title?: string;
  paragraphs?: string[];
  list?: string[];
  subList?: string[];
};

type Section = {
  title: string;
  intro?: string;
  blocks?: ParagraphBlock[];
};

const introduction: string[] = [
  `欢迎您使用${platformName}的产品和服务。${platformName}由${companyName}设计开发，与之相关的全部著作权、商标权、专利权、商业秘密等知识产权均归${companyName}所有。`,
  `“${platformName}”产品（网址：${officialSite}，下称“本产品”）的所有权和运营权均归${companyName}所有。`,
  `为使用${platformName}的产品和服务，您应当阅读并遵守《${platformName}用户使用协议》（下称“本协议”）。当您注册成为本产品用户、浏览本产品信息或使用特定功能时，即视为您与本产品之间已经签订本协议并产生法律效力，您应遵守本协议及平台发布的全部规则。遇到特殊服务或产品时，您还需签署适用的专项协议。`,
  '从事股票、债券等证券或衍生品以及期权、期货、外汇、海外资产等投资存在巨大风险，并非所有个人或机构均适合参与。使用本产品信息或服务前，请确保您具备相应判断能力并承担全部风险。',
  '本产品仅提供证券、理财及相关金融市场的第三方信息平台服务，信息来源可能是用户或其他机构个体，平台不对信息的真实性、合法性、准确性、及时性与完整性承担责任。',
];

const sections: Section[] = [
  {
    title: `1. ${platformName} 服务内容`,
    blocks: [
      {
        title: '1.1 内容',
        paragraphs: [
          '平台通过数据和算法提供公募基金多维度分析，包括市场情绪、基金、基金经理、基金公司、基金 PK 等模块；可输出文章、音视频等研究内容；支持添加自选基金/策略、创建组合并跟踪调仓表现。',
        ],
        list: [
          `${companyName}提供的所有服务和信息仅供参考，不构成投资操作的直接依据，对用户投资决策造成的风险或损失不承担任何经济与法律责任。`,
          `使用${companyName}的服务及产品需自行承担风险，在任何情况下${companyName}不对因使用或不能使用本公司服务所发生的特殊、意外、直接或间接损失承担赔偿责任。`,
        ],
      },
      {
        title: '1.2 与合作机构的关系',
        paragraphs: [
          `${companyName}不提供在线交易服务，证券交易及理财产品由合作机构完成。用户需自行与合作机构建立交易关系，费用由合作机构经用户同意后收取。`,
        ],
      },
      {
        title: '1.3 服务调整权',
        paragraphs: [`${companyName}有权决定并修改服务内容，包括但不限于：`],
        list: [
          '随时扩展、修改、减少或停止服务内容；',
          '对服务内容加以限制或调整；',
          '规定或改变提供全部或部分服务内容的服务时间。',
        ],
        subList: [
          '上述修改自决定之时起生效，无需另行通知。本产品行使修改或中断服务的权利无需向用户或第三方承担责任或赔偿。',
        ],
      },
    ],
  },
  {
    title: '2. 用户帐号',
    blocks: [
      {
        title: '2.1 注册',
        paragraphs: [
          '注册者资格：完成注册或以其他允许方式使用本服务时，您应具备完全民事权利能力和行为能力。若不具备前述资格，应承担因此产生的全部后果，且本公司有权注销（永久冻结）账户并索赔。',
          '注册与账户：在您按页面提示填写信息、阅读并同意本协议并完成注册/激活，或以其他方式实际使用本产品服务时，即受本协议约束，可使用用户名或平台允许的其它方式登录。',
          '您应依法律法规要求准确提供并及时更新信息，确保真实、完整、准确。如提供的信息存在错误、不实、过时或不完整，平台有权要求更正、删除资料直至中止或终止服务，由此产生的损失由您承担。',
          '请准确填写并及时更新电子邮箱、电话等联系方式，以便平台或其他用户联系您。因联系方式失效产生的损失或费用由您自行承担。',
        ],
      },
      {
        title: '2.2 账户安全',
        list: [
          '您应妥善保管账号与密码，并对该账号下的所有活动负责；',
          '如发现账号被未授权使用或存在安全问题，应立即修改密码并通知平台。因黑客或保管不善导致的损失由您自行承担；',
          '账号所有权归本产品，若连续 3 个月未使用，平台保留收回权；',
          '除法律或司法裁定并征得平台同意外，账号及密码不得转让、赠与或继承（与账户相关的财产权益除外）。',
        ],
      },
      {
        title: '2.3 账户注销',
        paragraphs: [
          '如用户违反国家法律法规或本条款，平台保留终止提供服务的权利。',
        ],
      },
    ],
  },
  {
    title: '3. 使用规则',
    blocks: [
      {
        paragraphs: [
          '用户使用本产品服务时应遵守中华人民共和国法律法规，并对自行发表、上传或传播的内容负责。如发布违法内容，平台有权处理并终止服务且不退还费用。',
        ],
        list: [
          '不得违反国家法律、政策；',
          '不得发布违反政治宣传或新闻规定的内容；',
          '不得涉及国家秘密或安全；',
          '不得违反民族或宗教政策；',
          '不得散布封建迷信、淫秽色情、赌博、暴力、恐怖或教唆犯罪信息；',
          '不得损害社会秩序、公共道德；',
          '不得侮辱、诽谤他人或侵害合法权益；',
          '不得包含其他法律法规禁止的内容。',
        ],
        subList: [
          '用户承诺不得为他人发布违法或违规信息提供便利，包括设置链接等。因违规造成的损失由用户赔偿。',
        ],
      },
      {
        paragraphs: [
          '用户在浏览或使用本产品时，还应遵守宪法基本原则，不得危害国家安全、煽动民族仇恨、破坏社会稳定或侵犯他人权益。',
        ],
      },
      {
        paragraphs: [
          '如用户违规，本产品可要求整改或直接删除内容、暂停/终止服务。用户自备访问所需设备和网络，并自行承担因网络或设备问题导致的中断或延迟。',
        ],
      },
    ],
  },
  {
    title: '4. 知识产权保护',
    blocks: [
      {
        paragraphs: [
          `除第三方产品或服务外，本产品所有内容均由${companyName}或关联企业享有知识产权。未经书面同意不得擅自使用、复制、出售、公开传播或发布，否则需承担赔偿责任。`,
          '平台内容仅代表作者观点；被授权的浏览、复制、打印和传播不得用于商业用途，且须注明来源并署名作者。恶意转载者平台保留追诉权。',
          '用户承诺其发布/上传的信息享有完整知识产权或合法授权；如致第三方索赔，用户应全额补偿平台的全部费用。平台在收到权利通知后可删除涉嫌侵权信息，除非用户提供证据排除侵权可能。',
        ],
      },
    ],
  },
  {
    title: '5. 用户信息保护',
    blocks: [
      {
        title: '5.1 用户个人信息',
        paragraphs: [
          `${companyName}会在合法范围内将收集的信息用于审计、数据分析、研究及内部共享，以改进产品与服务。在不透露单个用户隐私的前提下，平台可对用户数据进行分析并商业化利用。`,
          '平台可能与第三方合作提供网络服务。如第三方承担同等隐私责任，平台可向其提供注册资料，仅用于提供或改进平台及相关产品服务，不会为了第三方营销而共享，更不会出售个人信息。',
        ],
      },
      {
        title: '5.2 用户保密信息',
        paragraphs: [
          '对用户拥有知识产权并上传至本产品的文本、数据、图表等，平台可能在提供技术服务时访问，并承诺严格保密，未经许可不对外披露。服务终止后将不可恢复地删除服务器上的保密信息。本保密义务不适用于：',
        ],
        list: [
          '已为公众所知的信息；',
          '由其他渠道获知的信息；',
          '因法律适用或政府机关要求需披露的信息。',
        ],
      },
      {
        title: '5.3 信息披露例外',
        paragraphs: [
          '平台不对外公开单个用户的注册资料及非公开内容，但以下除外：',
        ],
        list: [
          '事先获得用户明确授权；',
          '法律法规要求；',
          '政府、司法或仲裁机构要求；',
          '为维护社会公众利益。',
        ],
      },
    ],
  },
  {
    title: '6. 责任声明',
    blocks: [
      {
        paragraphs: [
          '用户明确同意，其浏览或使用本产品服务所产生的风险与后果由用户自负，平台不承担责任。',
          '平台不保证网络服务符合用户需求，也不保证及时性、安全性、准确性。因系统维护、设备故障、不可抗力、黑客或第三方问题造成的服务中断或延迟，平台不承担赔偿责任。',
          '平台有权随时暂时或永久修改或终止服务，对用户或第三人无需承担责任。所有数据仅供参考，对其准确性、即时性及稳定性不作保证。',
          '平台不对外部链接内容负责。',
          '对于免费服务、赠送产品或收费服务附赠产品的质量缺陷导致的损失，平台不承担责任；合作单位、顾问及代理提供的服务由其自行负责。',
          '在法律允许情况下，平台不对任何间接、惩罚性、特殊或派生损失负责，即使已被告知潜在损失。除非另有规定，赔偿责任总额不超过向用户收取的当次服务费用。',
        ],
      },
    ],
  },
  {
    title: '7. 附则',
    blocks: [
      {
        paragraphs: [
          '本协议的效力、解释、变更、执行与争议解决适用中华人民共和国大陆地区法律（不含冲突法）。如发生争议，双方同意提请仲裁委员会管辖。',
          '本协议条款标题仅为阅读方便，不作解释依据。任一条款无效或不可执行，不影响其他条款效力。本协议解释权及修订权归平台所有，用户应及时关注更新；如不同意变更，应停止使用本产品，继续使用视为接受变更。',
          '本协议自用户注册成为本产品用户时生效。',
        ],
      },
    ],
  },
];

export const metadata: Metadata = {
  title: `用户协议 | ${platformName}`,
  description: `阅读${platformName}用户使用协议，了解权利义务与责任。`,
};

export default function Page() {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            更新日期：{updatedDate} ｜ 生效日期：{effectiveDate}
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {platformName} 用户协议
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            以下条款整理自 {platformName}（{officialSite}
            ）的用户协议，旨在帮助您快速了解使用平台产品与服务时的权利与义务。
          </p>
        </header>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
          {introduction.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>

        <article className="mt-12 space-y-8">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-foreground">
                {section.title}
              </h2>

              {section.intro ? (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {section.intro}
                </p>
              ) : null}

              {section.blocks?.map((block) => (
                <div
                  key={block.title ?? block.paragraphs?.[0]}
                  className="mt-6 space-y-3"
                >
                  {block.title ? (
                    <h3 className="text-base font-semibold text-foreground">
                      {block.title}
                    </h3>
                  ) : null}
                  {block.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {block.list ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground">
                      {block.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {block.subList ? (
                    <div className="space-y-2 rounded-2xl border border-dashed border-border/50 bg-background/70 p-4 text-sm leading-relaxed text-muted-foreground">
                      {block.subList.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
