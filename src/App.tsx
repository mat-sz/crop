import React from 'react';
import { observer } from 'mobx-react-lite';

import './index.scss';
import { Steps } from './components/Steps';
import { SelectFile } from './steps/SelectFile';
import { mainStore } from './stores/main';
import { Crop } from './steps/Crop';
import { Render } from './steps/Render';
import { runInAction } from 'mobx';

export const App: React.FC = observer(() => {
  const step = mainStore.step;

  return (
    <div className="app">
      <h1>crop.mov</h1>
      <Steps
        current={step}
        onChange={step => {
          runInAction(() => {
            mainStore.step = step;
          });
        }}
        steps={['Select file', 'Crop', 'Render']}
      />

      {step === 0 && <SelectFile />}
      {step === 1 && <Crop />}
      {step === 2 && <Render />}
    </div>
  );
});
