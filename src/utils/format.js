export function formatBizNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  const part1 = digits.slice(0, 3)
  const part2 = digits.slice(3, 5)
  const part3 = digits.slice(5, 10)
  return [part1, part2, part3].filter(Boolean).join('-')
}
