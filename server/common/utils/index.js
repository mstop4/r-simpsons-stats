const logNotInTest = (string) => {
  if (process.env.ENV !== 'test') {
    console.log(string);
  }
};

const inlineWriteNotInTest = (string) => {
  if (process.env.ENV !== 'test') {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(string);
  }
};

module.exports = {
  logNotInTest,
  inlineWriteNotInTest
};