const intRandomRange = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const shuffle = (array) => {
  const newArray = [...array];

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = intRandomRange(0, i-1);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
};

export {
  intRandomRange,
  shuffle
};