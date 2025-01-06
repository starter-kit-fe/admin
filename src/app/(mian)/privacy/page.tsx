import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import pkg from '../../../../package.json';

export default function PrivacyPolicy() {
  return (
    <div className="py-10 px-10 space-y-8">
      <h1 className="text-4xl font-bold">隐私政策</h1>
      <Separator className="my-4" />
      <div className="space-y-2">
        <div>更新日期：2022年07月06日</div>
        <div>生效日期：2022年07月06日</div>
        <div>
          欢迎访问[{pkg.shortName}
          ]（&quot;本网站&quot;）。在使用本网站前，请仔细阅读以下服务条款（&quot;隐私政策&quot;）。通过访问或使用本网站，即表示您同意受本条款的约束。本政策主要针对用户注册使用本产品时涉及到个人信息的部分。
        </div>
      </div>
      <ol className="list-decimal space-y-6 pl-5">
        <li>
          <div className="font-semibold text-lg">本政策的适用范围</div>
          <div>
            本隐私政策适用于本平台所有服务；服务包括向您提供内容浏览、技术服务等,本隐私政策不适用于其他第三方向您提供的服务,需要特别说明的是，作为本平台的用户，若您利用本平台的服务，为您的用户再行提供服务，因您的业务数据属于您所有，您应当另行与您的用户约定隐私政策。
          </div>
        </li>
        <li>
          <div className="font-semibold text-lg">
            我们如何收集和使用您的用户信息
          </div>
          <div>
            个人信息是以电子或者其他方式记录的与已识别或者可识别的自然人有关的各种信息，不包括匿名化处理后的信息。敏感个人信息是一旦泄露或者非法使用，容易导致自然人的人格尊严受到侵害或者人身、财产安全受到危害的个人信息，包括生物识别、宗教信仰、特定身份、医疗健康、金融账户、行踪轨迹等信息，以及不满十四周岁未成年人的个人信息。（我们将在本政策中对涉及到的敏感个人信息以粗体进行显著标识）。请在使用我们为您提供的服务前谨慎考虑，您的明示同意意味着这些敏感个人信息将按照本隐私政策阐明的目的和方式来进行处理。
          </div>
        </li>
        <li>
          <div className="font-semibold text-lg">信息收集</div>
          <div>当您使用我们的网站时，我们可能会收集以下类型的信息：</div>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <div>
                用户提供的信息：
                当您注册账户或填写表单时，我们可能会要求您提供个人信息，例如您的姓名、邮箱地址等。
              </div>
            </li>
            <li>
              <div>
                自动收集的信息：
                我们的服务器或第三方服务提供商可能会自动收集与您的访问和使用相关的信息，例如您的
                IP 地址、设备信息、浏览器类型和版本、访问时间和日期等。
              </div>
            </li>
          </ul>
        </li>
        <li>
          <div className="font-semibold text-lg">信息使用</div>
          <div>我们收集的信息将用于以下目的：</div>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <div>
                我们使用收集的信息来提供、维护和改进我们的服务，包括用户身份验证、客户支持等。
              </div>
            </li>
            <li>
              <div>
                我们可能会使用您提供的联系方式与您沟通，例如向您发送重要通知、更新或营销信息。
              </div>
            </li>
            <li>
              <div>
                我们可能会使用收集的信息进行统计分析，以了解用户的偏好和行为，从而改进我们的服务和用户体验。
              </div>
            </li>
          </ul>
        </li>
        <li>
          <div className="font-semibold text-lg">信息分享</div>
          <div>
            我们不会出售、交易或转让您的个人信息给第三方。但在以下情况下，我们可能会与第三方分享您的信息：
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <div>
                我们可能会根据法律法规、法院命令或政府要求披露您的个人信息。
              </div>
            </li>
            <li>
              <div>
                我们可能会与第三方服务提供商合作，以提供和维护我们的服务，这些服务提供商可能会访问您的个人信息。
              </div>
            </li>
          </ul>
        </li>
        <li>
          <div className="font-semibold text-lg">信息保护</div>
          <div>
            我们采取了一系列安全措施来保护您的个人信息免受未经授权的访问、使用或泄露。然而，请注意，互联网上的数据传输和存储并非百分之百安全，我们无法保证绝对安全。
          </div>
        </li>
        <li>
          <div className="font-semibold text-lg">我们可能需要的一些权限</div>
          <div>
            为保障本平台相关功能实现与应用安全稳定运行，我们需要您同意下列权限：
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <div>
                联网: 需要访问您的网络，为您提供更个性化的服务，应用基础权限。
              </div>
            </li>
            <li>
              <div>
                本地存储:需要访问您的本地存储，才能保存您想要保存的数据。
              </div>
            </li>
          </ul>
        </li>
        <li>
          <div className="font-semibold text-lg">未成年人隐私</div>
          <div>
            我们尊重您的隐私权，并按照我们的隐私政策收集、使用和保护您的个人信息。有关详细信息，请参阅我们的
            <Link href="/privacy" className="underline inline-block">
              隐私政策
            </Link>
            。
          </div>
        </li>
        <li>
          <div className="font-semibold text-lg">第三方链接</div>
          <div>
            我们的服务不针对未满法定年龄的人士。如果您是未成年人，请在父母或监护人的监督下使用我们的服务，并在必要时获取其同意。
          </div>
        </li>
        <li>
          <div className="font-semibold text-lg">隐私权更新</div>
          <div>
            我们可能会不时更新本隐私政策，以反映法律、技术或业务的变化。在这种情况下，我们将在网站上发布更新的隐私政策，并通过电子邮件或其他适当方式通知您。
          </div>
        </li>
        <li>
          <div className="font-semibold text-lg">联系我们</div>
          <div>
            如果您对本条款有任何疑问，请通过邮箱（
            <Link
              href="mailto:help@tigerzh.com"
              className="underline inline-block"
            >
              help@tigerzh.com
            </Link>
            ）与我们联系。
          </div>
        </li>
      </ol>
      <div className="font-semibold text-lg">结语</div>
      <div>
        感谢您阅读本服务条款并使用我们的网站。如果您有任何疑问或需要进一步的信息，请随时联系我们。
      </div>
    </div>
  );
}
