import './index.less';
import React, { useState, useEffect } from 'react';
import { defaultMemesSet } from './defaultMemesSet';

/**
 * MemeLoading 组件 - 趣味全局 loading 遮罩
 *
 * @param loadingSignal 是否显示 loading 遮罩
 * @param trueFan 彩蛋模式，true 时固定显示第 29 条 meme
 * @param memes 可自定义 meme 列表
 * @param backgroundColor 遮罩背景色
 * @param minDuration 最短显示时间（秒），safemod=true 时强制为 0.1
 * @param safemod 安全模式，true 时不显示字符且所有动画加速为 0.1 秒
 * @param boostDuration boot 阶段加速时间（秒），safemod=true 时强制为 0.1
 */
export interface MemeLoadingProps {
  /** 是否显示 loading 遮罩 */
  loadingSignal: boolean;
  /** 彩蛋模式，true 时固定显示第 29 条 meme */
  trueFan?: boolean;
  /** 可自定义 meme 列表 */
  memes?: string[];
  /** 遮罩背景色 */
  backgroundColor?: string;
  /** 最短显示时间（秒），safemod=true 时强制为 0.1 */
  minDuration?: number;
  /** 安全模式，true 时不显示字符且所有动画加速为 0.1 秒 */
  safemod?: boolean;
  /** boot 阶段加速时间（秒），safemod=true 时强制为 0.1 */
  boostDuration?: number;
}

const MemeLoading: React.FC<MemeLoadingProps> = ({
  loadingSignal,
  trueFan = false, //真的粉丝请把这个参数改成true
  memes = defaultMemesSet,
  backgroundColor = '', // 默认背景色为空
  minDuration = 0, // 默认无最短时间
  safemod = false, // 默认关闭 safemod
  boostDuration = 0.1, // 默认0.1秒
}) => {
  const [status, setStatus] = useState<'load' | 'boot' | 'off'>('off');
  const [currentMeme, setCurrentMeme] = useState('');
  const [memeIndex, setMemeIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [show, setShow] = useState(false); // 控制遮罩显示
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (loadingSignal) {
      setStatus('load');
      setShow(true);
      setStartTime(Date.now());
    } else {
      setStatus('boot');
      // safemod 下 minDuration 强制为 0.1
      const elapsed = Date.now() - startTime;
      const minDur = safemod ? 0.1 : minDuration;
      const remain = Math.max(minDur * 1000 - elapsed, 0);
      setTimeout(() => {
        setStatus('off');
        setShow(false);
      }, 1000 + remain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingSignal, safemod, minDuration]);

  useEffect(() => {
    let interval: number;
    if (status === 'load') {
      let randomIndex = Math.floor(Math.random() * memes.length);
      let meme = memes[randomIndex];
      if (trueFan) {
        //真的粉丝请使用这个载入
        randomIndex = 28;
        meme = memes[randomIndex];
      }
      setCurrentMeme('');
      setMemeIndex(randomIndex);
      setCharIndex(0);
      interval = window.setInterval(() => {
        setCharIndex((prevIndex) => {
          if (prevIndex < meme.length) {
            setCurrentMeme((prevMeme) => prevMeme + meme[prevIndex]);
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
      // boostDuration 最低0.1，safemod下强制为0.1
      const boost = safemod ? 0.1 : Math.max(boostDuration, 0.1);
      const intervalTime = remainingChars > 0 ? (boost * 1000) / remainingChars : boost * 1000;
      interval = window.setInterval(() => {
        setCharIndex((prevIndex) => {
          if (prevIndex < meme.length) {
            setCurrentMeme((prevMeme) => prevMeme + meme[prevIndex]);
            return prevIndex + 1;
          } else {
            clearInterval(interval);
            return prevIndex;
          }
        });
      }, intervalTime);
    }
    return () => clearInterval(interval);
  }, [status, memes, trueFan, memeIndex, charIndex, boostDuration, safemod]);
  const visibility = show ? 'visible' : 'hidden';
  const visibleMeme = safemod ? '' : currentMeme;

  return (
    <div className="meme-loading" style={{ visibility, backgroundColor }}>
      <div className="meme">{safemod ? '' : visibleMeme + '_'}</div>
      {/* 我真的没有故意设置成 '_' */}
    </div>
  );
};

export default MemeLoading;
