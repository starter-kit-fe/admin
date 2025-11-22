import type { Metadata } from 'next';

import pkg from '../../../../package.json';

const brandName =
  pkg.seo?.title?.split('—')[0]?.trim() ?? pkg.name ?? 'Admin Template';
const platformName = `${brandName} 平台`;
const companyName = 'VOH 科技有限公司';
const officialSite =
  process.env.NEXT_PUBLIC_SITE_URL ?? pkg.seo?.og?.url ?? 'https://admin.com';
const contactEmail = 'support@admin.com';

const updatedDate = '2022年07月06日';
const effectiveDate = '2022年07月06日';

const summaryList = [
  '一、本政策的适用范围',
  '二、我们如何收集和使用您的用户信息',
  '三、我们如何委托处理、共享、转让、公开披露您的用户信息',
  '四、我们如何保护、存储、删除您的用户信息',
  '五、Cookie和同类技术的使用',
  '六、您的权利',
  '七、免责声明',
  '八、本政策如何更新',
  '九、法律适用及争议解决',
  '十、如何联系我们',
];

const sdkList = [
  {
    name: '友盟统计（含友盟组件化基础库）',
    info: 'Mac 地址、唯一设备识别码 (IMEI / Android ID / IDFA / OPENUDID / GUID、SIM 卡 IMSI 信息)',
    purpose:
      '提供统计分析服务，并通过地理位置校准数据准确性，提供基础反作弊能力。',
  },
  {
    name: '极光',
    info: '地理位置、设备标识符（IMEI、IDFA、Android ID、MAC、OAID 等）、应用信息、设备参数及系统信息、IP 地址、WiFi/基站信息等',
    purpose: '用于向用户推送消息。',
  },
  {
    name: '个验一键登录',
    info: '存储的个人文件、手机状态与身份、网络信息、手机号、SIM 卡序列号、ICCID、IMSI、运营商、IDFA、IMEI、MAC、ANDROID_ID、IP、WiFi 信息、OpenUDID/GUID、bssid、应用安装列表、剪切板、网络访问权限与状态等',
    purpose: '用于用户登录和账号认证。',
  },
];

const contactInfo = [
  `公司名称：${companyName}`,
  `公司官网：${officialSite}`,
  `联系邮箱：${contactEmail}`,
];

export const metadata: Metadata = {
  title: `隐私政策 | ${platformName}`,
  description: `了解${platformName}如何按本隐私政策收集、使用、存储与共享个人信息。`,
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
            {platformName} 隐私政策
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {companyName}{' '}
            深知用户信息安全的重要性，并承诺依照法律法规采取安全措施保护您的信息。
            本政策适用于 {platformName}（{officialSite}
            ）及产品内提供的全部服务。
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            使用或继续访问本平台即表示您已知晓并同意本政策条款，同意我们按照本政策收集、存储、使用和分享您的信息。
            我们遵循权责一致、目的明确、选择同意、最小必要、确保安全、主体参与和公开透明等原则。
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">本政策帮助您了解：</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground">
            {summaryList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <article className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">一、本政策的适用范围</h2>
            <p className="mt-4">
              本政策适用于本平台提供的所有服务，包括内容浏览、技术服务等。第三方向您提供的服务适用其自身的隐私政策。
              如您使用本平台服务向您的用户再次提供服务，业务数据归您所有，应另行与您的用户约定隐私规则。
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              二、我们如何收集和使用您的用户信息
            </h2>
            <div className="mt-4 space-y-4">
              <p>
                根据《个人信息保护法》，个人信息指与已识别或可识别的自然人有关的信息，不含匿名化信息。
                <strong className="font-semibold text-foreground">
                  敏感个人信息（如生物识别、宗教信仰、特定身份、医疗健康、金融账户、行踪轨迹及不满十四周岁未成年人信息）
                </strong>
                需谨慎处理。您的明示同意意味着我们将按本政策所述目的和方式处理这些信息。
              </p>

              <div className="rounded-2xl border border-border/40 bg-background/70 p-4 space-y-3">
                <h3 className="text-base font-semibold text-foreground">
                  1. 需您授权收集和使用的情形
                </h3>
                <p>
                  1.1
                  帮助注册：注册账户时需收集手机号码、短信验证码、用户名、密码等，您可自主完善邮箱等资料。
                </p>
                <p>
                  1.2
                  实名认证：为交易安全合规，当您购买或使用产品前可能需要实名认证。
                  自然人需提供姓名、身份证号、手机号、邮箱等；企业用户需提供名称、法定代表人、统一社会信用代码、部门、营业执照副本等。
                </p>
                <p>1.3 其他信息包括：</p>
                <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
                  <li>
                    中国境内手机号码：用于登录、认证、业务通知、客户调查、商务推广等。
                  </li>
                  <li>
                    Email 地址：与手机号用途类似，可接收验证码、通知、合同等。
                  </li>
                  <li>
                    发票寄送信息：为开具发票需收集收件人姓名、地址、邮编、手机号等。
                  </li>
                  <li>若特定服务需要额外信息，我们将另行说明并征得同意。</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border/40 bg-background/70 p-4 space-y-2">
                <h3 className="text-base font-semibold text-foreground">
                  2. 我们自主收集的信息
                </h3>
                <p>
                  为优化体验和保护安全，我们会自动收集网络日志（登录时间、状态、方式、IP、浏览器、操作记录等），用于核对业务信息与保障账号安全。
                </p>
              </div>

              <div className="rounded-2xl border border-border/40 bg-background/70 p-4 space-y-2">
                <h3 className="text-base font-semibold text-foreground">
                  3. 无需征得授权同意的情形
                </h3>
                <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
                  <li>
                    与国家安全、国防安全、公共安全、公共卫生或重大公共利益有关；
                  </li>
                  <li>与犯罪侦查、起诉、审判及执行有关；</li>
                  <li>
                    为维护您或他人生命财产等重大合法权益且难以取得本人同意；
                  </li>
                  <li>您自行公开的信息或合法公开渠道获取的信息；</li>
                  <li>根据您的要求签订或履行合同所必需；</li>
                  <li>维护产品或服务安全稳定运行所必需；</li>
                  <li>基于公共利益的学术研究并对结果去标识化处理；</li>
                  <li>法律法规规定的其他情形。</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border/40 bg-background/70 p-4 space-y-2">
                <h3 className="text-base font-semibold text-foreground">
                  4. 信息使用规则
                </h3>
                <p>
                  我们仅为实现产品/服务功能使用收集的信息，并可能基于统计数据设计、开发、推广新产品/服务。统计信息不含可识别您的数据，可在合理范围内向公众或第三方分享。
                </p>
              </div>

              <div className="rounded-2xl border border-border/40 bg-background/70 p-4 space-y-3">
                <h3 className="text-base font-semibold text-foreground">
                  5. 必要权限与第三方 SDK
                </h3>
                <p>
                  为保障功能实现与运行稳定，我们可能申请摄像头、联网、本地存储、相机/相册等权限（如扫码快捷登录、上传头像）。
                  同时我们会接入部分第三方
                  SDK，并对其进行安全检测以保障数据安全。
                </p>
                <div className="overflow-x-auto rounded-2xl border border-dashed border-border/50">
                  <table className="min-w-full divide-y divide-border/60 text-left text-xs md:text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">SDK 名称</th>
                        <th className="px-4 py-3 font-medium">信息获取范围</th>
                        <th className="px-4 py-3 font-medium">使用目的</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 bg-background/80">
                      {sdkList.map((sdk) => (
                        <tr key={sdk.name} className="align-top">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {sdk.name}
                          </td>
                          <td className="px-4 py-3">{sdk.info}</td>
                          <td className="px-4 py-3">{sdk.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold">
              三、我们如何委托处理、共享、转让、公开披露您的用户信息
            </h2>
            <p>
              某些模块由外部供应商提供，我们会在获取您的单独同意后向其提供必要信息，并签署严格的委托或保密协议，监督其处理活动。
            </p>
            <p>
              除以下情形外，我们不会与 {companyName}{' '}
              以外的公司、组织或个人共享信息：
            </p>
            <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
              <li>获得您的明确授权同意；</li>
              <li>法律法规或监管要求；</li>
              <li>实现核心功能所必需；</li>
              <li>符合已签署的政策或法律文件；</li>
              <li>与具控制权的关联方共享，且仅限必要信息；</li>
              <li>经授权的合作伙伴提供服务所需；</li>
              <li>为确保安全、识别账号风险、防范欺诈等必要场景。</li>
            </ul>
            <p>未经您的明确同意，我们不会转让您的个人信息。</p>
            <p>
              若发生合并、收购或破产清算涉及信息转让，我们会要求新主体继续受本政策约束，否则将重新征求您的授权同意。
            </p>
            <p>
              原则上我们不会公开披露个人信息，除非事先取得您的同意或依据法律法规披露。
            </p>
            <p>
              在国家安全、公共安全、刑事侦查、生命财产保护、您自行公开信息或合法公开渠道等情形下，共享/转让/披露可不另行取得授权。
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold">
              四、我们如何保护、存储、删除您的用户信息
            </h2>
            <p>
              我们采取严格的数据访问控制、多重身份认证和安全技术措施保护您的信息，仅在实现目的所需期限内保留，并在发生安全事件时按法规通知您并上报监管。
            </p>
            <p>
              我们在中国大陆境内运营中收集的信息将存储在境内，除非法律规定或经您授权并完成安全评估后需向境外传输。
            </p>
            <p>
              您可申请删除个人信息，我们将在核验后删除或匿名化。账号注销后，我们也会删除或匿名化个人信息，但法律另有规定的除外。
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              五、Cookie 和同类技术的使用
            </h2>
            <p className="mt-4">
              为提升体验，我们使用 Cookie
              以免重复输入信息并跟踪浏览器状态。如浏览器允许，您可以拒绝
              Cookie，但可能影响部分功能。
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold">六、您的权利</h2>
            <p>
              您可登录账户处理信息，所有操作视为您或经授权的主体行为，法律后果由您承担。如账号被盗或异常，请及时联系我们。
            </p>
            <p>
              您有权访问、更正、删除个人信息，可通过客服或邮件提出，我们将在 7
              日内回复。若我们处理行为违法、未征同意、严重违约、您不再使用服务或我们停止提供服务，您可要求删除信息。
            </p>
            <p>
              对额外信息的收集与使用，您可随时撤回同意；撤回后我们将停止处理，但不影响此前基于授权的处理行为。
            </p>
            <p>
              我们可能向您推送产品功能或商业信息，您可随时联系客服取消。对于恶意、滥用、危及他人权益的请求，我们可能拒绝。
            </p>
            <p>
              以下情形无法响应请求：履行法律义务、国家安全、公共利益、刑事活动、证据显示存在恶意或滥用、可能损害他人合法权益、涉及国家秘密或商业秘密等。
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">七、免责声明</h2>
            <p className="mt-4">
              因您将账号或密码告知他人、共享账户或其他非本平台原因导致的信息泄露，本平台不承担责任。
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">八、本政策如何更新</h2>
            <p className="mt-4">
              我们可能适时修订本政策，并通过版本更新等方式提示。请仔细阅读变更内容，您继续使用本平台即表示同意我们按更新后的政策处理信息。
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold">九、法律适用及争议解决</h2>
            <p>
              本政策的成立、生效、履行、解释及争议解决适用中华人民共和国大陆地区法律（不含冲突法）。如发生争议，双方应先友好协商；协商
              30 日未果的，提交 {companyName} 所在地有管辖权的人民法院诉讼解决。
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold">十、如何联系我们</h2>
            <p>如有疑问或需要帮助，请通过以下方式联系我们：</p>
            <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
              {contactInfo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              我们将在合理确认您身份之日起 30
              日内回复。如对回复不满意，可向网信、电信、公安及工商等监管部门投诉或举报。
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
