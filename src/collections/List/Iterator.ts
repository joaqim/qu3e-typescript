export interface IIterator<T> {
  Reset: () => void;
  CurrentElement: () => T | undefined;
  NextElement: () => boolean;
}

export interface IIterable<T> {
  GetIterator: () => IIterator<T>;
}

export class Iterator<T> implements IIterator<T> {
  private index = -1;
  private readonly source: T[];

  public constructor(source: T[]) {
    this.source = source;
    this.Reset();
  }

  public Reset(): void {
    this.index = -1;
  }

  public NextElement(): boolean {
    if (this.index + 1 < this.source.length) {
      this.index += 1;
      return true;
    }

    return false;
  }

  public CurrentElement(): T | undefined {
    return this.source[this.index];
  }
}
