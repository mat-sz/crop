import React from 'react';
import clsx from 'clsx';

import styles from './Steps.module.scss';

interface StepsProps {
  current: number;
  steps: string[];
  onChange?: (step: number) => void;
}

export const Steps: React.FC<StepsProps> = ({ current, steps, onChange }) => {
  return (
    <ul className={styles.steps}>
      {steps.map((step, i) => (
        <li
          key={i}
          className={clsx({ [styles.current]: current === i })}
          onClick={() => {
            onChange?.(i);
          }}
        >
          {step}
        </li>
      ))}
    </ul>
  );
};
