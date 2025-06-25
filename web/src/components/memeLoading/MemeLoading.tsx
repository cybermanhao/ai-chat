import React, { useEffect, useState } from 'react';
import { useGlobalUIStore } from '@/store/globalUIStore';
import { defaultMemesSet } from './defaultMemesSet';
import './index.less';

export interface MemeLoadingProps {
  backgroundColor?: string;
  minDuration?: number;
  boostDuration?: number;
  memes?: string[];
}

const MemeLoading: React.FC<MemeLoadingProps> = ({
  backgroundColor = '',
  minDuration = 0.5,
  boostDuration = 0.1,
  memes = defaultMemesSet,
}) => {
  const loadingCount = useGlobalUIStore((s) => s.loadingCount);
  const dmMode = useGlobalUIStore((s) => s.dmMode);
  const isLoading = loadingCount > 0;

  const [status, setStatus] = useState<'load' | 'boot' | 'off'>('off');
  const [currentMeme, setCurrentMeme] = useState('');
  const [memeIndex, setMemeIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (isLoading) {
      setStatus('load');
      setShow(true);
      setStartTime(Date.now());
    } else {
      setStatus('boot');
      const elapsed = Date.now() - startTime;
      const remain = Math.max(minDuration * 1000 - elapsed, 0);
      setTimeout(() => {
        setStatus('off');
        setShow(false);
        setCurrentMeme('');
        setCharIndex(0);
      }, 1000 + remain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, minDuration]);

  useEffect(() => {
    let interval: number;
    if (status === 'load') {
      let randomIndex = memeIndex;
      let meme = memes[randomIndex];
      if (currentMeme.length === 0) {
        randomIndex = Math.floor(Math.random() * memes.length);
        meme = memes[randomIndex];
        setMemeIndex(randomIndex);
      }
      interval = window.setInterval(() => {
        setCharIndex((prevIndex) => {
          if (prevIndex < meme.length) {
            setCurrentMeme(meme.slice(0, prevIndex + 1));
            return prevIndex + 1;
          } else {
            clearInterval(interval);
            return prevIndex;
          }
        });
      }, 300);
    } else if (status === 'boot') {
      const meme = memes[memeIndex] || '';
      const remainingChars = meme.length - charIndex;
      const intervalTime = remainingChars > 0 ? (boostDuration * 1000) / remainingChars : boostDuration * 1000;
      setCurrentMeme(meme.slice(0, charIndex));
      interval = window.setInterval(() => {
        setCharIndex((prevIndex) => {
          if (prevIndex < meme.length) {
            setCurrentMeme(meme.slice(0, prevIndex + 1));
            return prevIndex + 1;
          } else {
            clearInterval(interval);
            return prevIndex;
          }
        });
      }, intervalTime);
    }
    return () => clearInterval(interval);
  }, [status, memes, memeIndex, charIndex, boostDuration]);

  // 动画结束后闪烁 '_'
  const meme = memes[memeIndex] || '';
  const isDone = currentMeme.length === meme.length;
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    if (isDone && status === 'load') {
      const blinkTimer = setInterval(() => setBlink(b => !b), 500);
      return () => clearInterval(blinkTimer);
    }
  }, [isDone, status]);
  const visibility = show ? 'visible' : 'hidden';
  const visibleMeme = dmMode ? '' : currentMeme + (isDone && status === 'load' ? (blink ? '_' : ' ') : '_');

  return (
    <div className="meme-loading" style={{ visibility, backgroundColor }}>
      <div className="meme">{dmMode ? '' : visibleMeme}</div>
    </div>
  );
};

export default MemeLoading;
