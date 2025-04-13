import { createSignal } from 'solid-js';

export const enum ImgStatus {
  LOADING = 'loading',
  GOOD = 'good',
  BAD = 'bad'
}

export function useImgStatus() {
  const [getImgStatus, setImgStatus] = createSignal(ImgStatus.LOADING);
  const isImgBad = () => getImgStatus() === ImgStatus.BAD;
  const isImgLoading = () => getImgStatus() === ImgStatus.LOADING;
  const isImgGood = () => getImgStatus() === ImgStatus.GOOD;

  return {
    getImgStatus,
    setImgStatus,
    isImgBad,
    isImgLoading,
    isImgGood,
  };
}
