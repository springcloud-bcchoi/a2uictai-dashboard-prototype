
import {Inter, Lusitana, Roboto} from 'next/font/google'
export const inter = Inter({subsets: ['latin']});

export const lusitana = Lusitana({
  weight: ['400', '700'],
  subsets: ['latin'],
});

// Roboto 폰트 설정
export const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin', 'latin-ext', 'cyrillic', 'greek', 'vietnamese'],
});