// /types/html-react-parser.d.ts

// html-react-parser の型定義が存在しない場合のフォールバック

declare module 'html-react-parser' {
  import { DOMNode, Element } from 'domhandler';

  export { DOMNode, Element };
  export default function parse(
    html: string,
    options?: any
  ): JSX.Element | JSX.Element[] | string;
}