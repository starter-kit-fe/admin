"use client";

import {Link} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {Transition, motion} from 'motion/react';

export default function NotFoundPage() {
  const t = useTranslations('NotFound');
  const springConfig: Transition = {
    type: 'spring',
    damping: 10,
    stiffness: 100,
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{scale: 0.5, opacity: 0}}
        animate={{scale: 1, opacity: 1}}
        transition={springConfig}
        className="flex w-full max-w-2xl flex-col items-center"
      >
        <motion.div
          initial={{y: -50}}
          animate={{y: 0}}
          transition={springConfig}
          className="mb-8 w-full max-w-md"
        >
          <UnDrawNotFound />
        </motion.div>
        <motion.h1
          className="mb-2 select-none text-center text-6xl font-bold text-gray-800"
          initial={{y: -20}}
          animate={{y: 0}}
          transition={springConfig}
        >
          404
        </motion.h1>
        <motion.p
          className="mb-8 select-none text-center text-xl text-gray-600"
          initial={{y: 20}}
          animate={{y: 0}}
          transition={{...springConfig, delay: 0.1}}
        >
          {t('description')}
        </motion.p>
      </motion.div>
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        transition={{delay: 0.3, duration: 0.5}}
      >
        <Link href="/">
          <motion.button
            className="select-none rounded-full bg-primary px-6 py-3 text-lg font-semibold text-white shadow-lg"
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
            transition={springConfig}
          >
            {t('cta')}
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}

function UnDrawNotFound() {
  return (
    <motion.svg
      animate={{
        y: [0, -10, 0],
        rotate: [0, -1, 1, 0],
      }}
      transition={{
        duration: 5,
        ease: 'easeInOut',
        times: [0, 0.2, 0.5, 0.8, 1],
        repeat: Infinity,
        repeatDelay: 1,
      }}
      className="h-auto w-full"
      viewBox="0 0 1120.59226 777.91584"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>not found</title>
      <circle cx="212.59226" cy="103" r="64" fill="#000" />
      <path
        d="M563.68016,404.16381c0,151.01141-89.77389,203.73895-200.51559,203.73895S162.649,555.17522,162.649,404.16381,363.16457,61.04208,363.16457,61.04208,563.68016,253.1524,563.68016,404.16381Z"
        transform="translate(-39.70387 -61.04208)"
        fill="#cbd5e1"
      />
      <polygon
        points="316.156 523.761 318.21 397.378 403.674 241.024 318.532 377.552 319.455 320.725 378.357 207.605 319.699 305.687 319.699 305.687 321.359 203.481 384.433 113.423 321.621 187.409 322.658 0 316.138 248.096 316.674 237.861 252.547 139.704 315.646 257.508 309.671 371.654 309.493 368.625 235.565 265.329 309.269 379.328 308.522 393.603 308.388 393.818 308.449 394.99 293.29 684.589 313.544 684.589 315.974 535.005 389.496 421.285 316.156 523.761"
        fill="#3f3d56"
      />
      <path
        d="M1160.29613,466.01367c0,123.61-73.4842,166.77-164.13156,166.77s-164.13156-43.16-164.13156-166.77S996.16457,185.15218,996.16457,185.15218,1160.29613,342.40364,1160.29613,466.01367Z"
        transform="translate(-39.70387 -61.04208)"
        fill="#cbd5e1"
      />
      <polygon
        points="950.482 552.833 952.162 449.383 1022.119 321.4 952.426 433.154 953.182 386.639 1001.396 294.044 953.382 374.329 953.382 374.329 954.741 290.669 1006.369 216.952 954.954 277.514 955.804 124.11 950.467 327.188 950.906 318.811 898.414 238.464 950.064 334.893 945.173 428.327 945.027 425.847 884.514 341.294 944.844 434.608 944.232 446.293 944.123 446.469 944.173 447.428 931.764 684.478 948.343 684.478 950.332 562.037 1010.514 468.952 950.482 552.833"
        fill="#3f3d56"
      />
      <ellipse
        cx="554.59226"
        cy="680.47903"
        rx="554.59226"
        ry="28.03433"
        fill="#3f3d56"
      />
      <ellipse
        cx="892.44491"
        cy="726.79663"
        rx="94.98858"
        ry="4.80162"
        fill="#3f3d56"
      />
      <ellipse
        cx="548.71959"
        cy="773.11422"
        rx="94.98858"
        ry="4.80162"
        fill="#3f3d56"
      />
      <ellipse
        cx="287.94432"
        cy="734.27887"
        rx="217.01436"
        ry="10.96996"
        fill="#3f3d56"
      />
      <circle cx="97.08375" cy="566.26982" r="79" fill="#2f2e41" />
      <rect
        x="99.80546"
        y="689.02332"
        width="24"
        height="43"
        transform="translate(-31.32451 -62.31008) rotate(0.67509)"
        fill="#2f2e41"
      />
      <rect
        x="147.80213"
        y="689.58887"
        width="24"
        height="43"
        transform="translate(-31.31452 -62.87555) rotate(0.67509)"
        fill="#2f2e41"
      />
      <ellipse
        cx="119.54569"
        cy="732.61606"
        rx="7.5"
        ry="20"
        transform="translate(-654.1319 782.47948) rotate(-89.32491)"
        fill="#2f2e41"
      />
      <ellipse
        cx="167.55414"
        cy="732.18168"
        rx="7.5"
        ry="20"
        transform="translate(-606.10996 830.26371) rotate(-89.32491)"
        fill="#2f2e41"
      />
      <path
        d="M368.59226,463.479C233.18629,463.46527,123.4343,353.6971,123.42056,218.29114c-.00009-9.54394.39077-19.08579,1.17008-28.6049,10.856,0,21.712-.19575,32.56805.05737,8.5393,0,16.82157-3.499,25.35776-3.50528,14.38619-.01089,26.64825,8.84256,39.99141,13.356,31.3388,10.65065,65.70057-2.719,97.24235,6.30261,29.524,8.34715,57.77947,21.2732,82.74765,38.904,17.1938,12.12153,33.458,25.70215,47.93272,41.05874,9.73325,10.498,18.34561,22.01667,24.56019,35.00789,10.18071,20.78659,13.83207,45.05461,7.21954,67.33987s-23.90118,41.83436-46.69276,49.12552c-15.11651,4.712-32.03223,3.81683-45.21878,12.17924-7.325,4.63806-12.65884,12.06886-20.07743,16.86474-14.78462,9.33629-34.11491,5.25619-51.057,5.91351-13.694.52809-27.365-1.30027-40.07007-5.4237-4.91508-1.59952-9.70283-3.57132-14.33387-5.88809-2.00446-.99935-3.98422-2.05212-5.93621-3.15557-1.61307-.92237-5.33638-3.93336-7.1189-3.93336Z"
        transform="translate(-39.70387 -61.04208)"
        fill="#f2f2f2"
      />
      <path
        d="M704.29613,500.01367c-11.22457-79.06805-38.0531-154.94436-83.5992-218.0428-8.8346-12.35987-18.624-24.08614-29.17746-35.066-6.91872,7.79879-13.2865,16.10262-19.05291,24.84354C542.496,332.74828,523.80834,400.3065,522.71293,469.01367q-1.58421,100.73226,0,201.46457H713.86257Q709.07987,550.78195,704.29613,500.01367Z"
        transform="translate(-39.70387 -61.04208)"
        fill="#f2f2f2"
      />
      <rect
        x="274.82931"
        y="675.71506"
        width="146"
        height="24"
        transform="translate(-388.30744 53.58187) rotate(-21.11058)"
        fill="#f2f2f2"
      />
      <rect
        x="510.82931"
        y="675.71506"
        width="146"
        height="24"
        transform="matrix(0.93, -0.37, 0.37, 0.93, -357.236, 143.624)"
        fill="#f2f2f2"
      />
      <circle cx="294.59226" cy="649.47903" r="51" fill="#f2f2f2" />
      <circle cx="294.59226" cy="649.47903" r="31" fill="#fff" />
      <circle cx="514.59226" cy="649.47903" r="51" fill="#f2f2f2" />
      <circle cx="514.59226" cy="649.47903" r="31" fill="#fff" />
      <circle cx="713.59226" cy="649.47903" r="51" fill="#f2f2f2" />
      <circle cx="713.59226" cy="649.47903" r="31" fill="#fff" />
      <circle cx="933.59226" cy="649.47903" r="51" fill="#f2f2f2" />
      <circle cx="933.59226" cy="649.47903" r="31" fill="#fff" />
    </motion.svg>
  );
}
