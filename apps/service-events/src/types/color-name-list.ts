declare module 'color-name-list' {
  interface ColorName {
    name: string;
    hex: string;
  }

  const colorNameList: ColorName[];
  export default colorNameList;
}
