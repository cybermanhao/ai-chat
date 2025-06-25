import './index.less';
import React, { useState, useEffect } from 'react';
import { defaultMemesSet } from './defaultMemesSet';

/**
 *  组件 - 趣味全局 loading 遮罩
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
  /**
   * 是否启用队列/计数模式（全局 loading 队列友好）
   * true: loadingSignal 为计数/队列（number），>0 显示
   * false: loadingSignal 为 boolean
   */
  queueMode?: boolean;
}

const MemeLoading: React.FC<MemeLoadingProps> = ({
  loadingSignal,
  trueFan = false, //真的粉丝请把这个参数改成true
  memes = defaultMemesSet,
  backgroundColor = '', // 默认背景色为空
  minDuration = 0, // 默认无最短时间
  safemod = false, // 默认关闭 safemod
  boostDuration = 0.1, // 默认0.1秒
  queueMode = false, // 默认非队列模式
}) => {
  const [status, setStatus] = useState<'load' | 'boot' | 'off'>('off');
  const [currentMeme, setCurrentMeme] = useState('');
  const [memeIndex, setMemeIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [show, setShow] = useState(false); // 控制遮罩显示
  const [startTime, setStartTime] = useState<number>(0);

  // 支持队列/计数模式
  const isLoading = queueMode
    ? (typeof loadingSignal === 'number' ? loadingSignal > 0 : !!loadingSignal)
    : !!loadingSignal;

  useEffect(() => {
    if (isLoading) {
      setStatus('load');
      setShow(true);
      setStartTime(Date.now());
      // 不重置 currentMeme/charIndex，动画不中断
    } else {
      setStatus('boot');
      const elapsed = Date.now() - startTime;
      // 这里minDuration已按safemod设定
      const remain = Math.max(minDuration * 1000 - elapsed, 0);
      setTimeout(() => {
        setStatus('off');
        setShow(false);
        setCurrentMeme('');
        setCharIndex(0);
      }, 1000 + remain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, safemod, minDuration]);

  useEffect(() => {
    let interval: number;
    if (status === 'load') {
      let randomIndex = memeIndex;
      let meme = memes[randomIndex];
      if (currentMeme.length === 0) {
        // 只在动画未开始时随机 meme
        randomIndex = trueFan ? 28 : Math.floor(Math.random() * memes.length);
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
      const boost = safemod ? 0.1 : Math.max(boostDuration, 0.1);
      const intervalTime = remainingChars > 0 ? (boost * 1000) / remainingChars : boost * 1000;
      setCurrentMeme(meme.slice(0, charIndex)); // 修复：boot 阶段重置 currentMeme
      interval = window.setInterval(() => {
        setCharIndex((prevIndex) => {
          if (prevIndex < meme.length) {
            setCurrentMeme(meme.slice(0, prevIndex + 1)); // 修复：slice 取前缀
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
  const visibleMeme = safemod ? '' : currentMeme + (isDone && status === 'load' ? (blink ? '_' : ' ') : '_');

  return (
    <div className="meme-loading" style={{ visibility, backgroundColor }}>
      <div className="meme">{safemod ? '' : visibleMeme}</div>
      {/* 我真的没有故意设置成 '_' */}
    </div>
  );
};

export default MemeLoading;
