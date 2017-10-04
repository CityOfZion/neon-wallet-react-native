export const quickSort = (arr, left, right) => {
    let pivot, partitionIndex

    if (left < right) {
        pivot = right
        partitionIndex = partition(arr, pivot, left, right)

        quickSort(arr, left, partitionIndex - 1)
        quickSort(arr, partitionIndex + 1, right)
    }
    return arr
}

const partition = (arr, pivot, left, right) => {
    const pivotValue = arr[pivot]
    let partitionIndex = left

    for (let i = left; i < right; i++) {
        if (arr[i] < pivotValue) {
            swap(arr, i, partitionIndex)
            partitionIndex++
        }
    }

    swap(arr, right, partitionIndex)
    return partitionIndex
}

const swap = (arr, i, j) => {
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
}
