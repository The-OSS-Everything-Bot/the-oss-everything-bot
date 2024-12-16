function moveZeros(arr) {
    for (let i = 0; i < arr.length; i++) {
      let pointer = arr.length - 1
      if(arr[i] === 0) {
        if(i === Math.abs(pointer - 1)) break
        while (arr[pointer] === 0) pointer -= 1
        console.log(pointer, i)
        
        arr[i] = arr[pointer]
        arr[pointer] = 0
      }
    }

    console.log(arr)
    
    return arr
  }

  moveZeros([1, 1, 0, 5, 0, 6, 2, 4])