import type { IIterable, IIterator } from "./Iterator"
import { Iterator } from "./Iterator"

export default class List<T> implements IIterable<T> {
  private values: T[]

  public constructor() {
    this.values = []
  }

  public Add(value: T): void {
    this.values.push(value)
  }

  public GetAt(index: number): T {
    return this.values[index]
  }

  public Clear(): void {
    this.values = []
  }

  public Find(value: T): T | undefined {
    return this.values.find((item: T) => item === value)
  }

  public IndexOf(value: T): number {
    let resultIndex = -1
    this.values.find((item: T, index: number) => {
      if (item === value) {
        resultIndex = index
        return true
      }
      return false
    })
    return resultIndex
  }

  public Remove(value: T): boolean {
    const index = this.IndexOf(value)

    if (index !== -1) {
      this.RemoveAt(index)
      return true
    }
    return false
  }

  public RemoveAt(index: number): boolean {
    if (index < this.values.length) {
      this.values.splice(index, 1)
      return true
    }

    return false
  }

  public ForEach(callback: (item: T) => void): void {
    this.values.forEach((item: T) => callback(item))
  }

  public Count(): number {
    return this.values.length
  }

  public GetIterator(): IIterator<T> {
    return new Iterator(this.values)
  }
}
