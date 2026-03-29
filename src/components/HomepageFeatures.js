import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: '简单易用',
    description: (
      <>Docusaurus 让创建网站变得简单，无需复杂的配置。</>
    ),
  },
  {
    title: '功能强大',
    description: (
      <>支持文档、博客、国际化等多种功能，满足各种需求。</>
    ),
  },
  {
    title: '高度可定制',
    description: (
      <>通过主题和插件系统，轻松定制网站外观和功能。</>
    ),
  },
];

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((feature, idx) => (
            <div key={idx} className={clsx('col col--4')}>
              <div className={styles.feature}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
