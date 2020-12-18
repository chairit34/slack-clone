import React from 'react';
import { Progress } from 'semantic-ui-react';

export default function Progressbar({ uploadState, percentUploaded }) {
  return (
    uploadState === 'uploading' && (
      <Progress
        className="progress__bar"
        percent={percentUploaded}
        progress
        indicating
        size="medium"
        inverted
      />
    )
  );
}
