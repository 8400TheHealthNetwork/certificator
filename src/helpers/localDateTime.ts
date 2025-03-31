const tzOffset = (new Date().getTimezoneOffset()) * 60 * 1000 * (-1);

const getLocalDateTime = (): string => {
  const localDate = new Date(Date.now() + tzOffset);
  return localDate.toISOString();
};

export { tzOffset, getLocalDateTime };
