export class TreeNode<T> {
  public data: T
  public leftNode?: TreeNode<T> | undefined
  public rightNode?: TreeNode<T> | undefined

  public constructor(data: T) {
    this.data = data
  }
}
