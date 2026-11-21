const form = document.getElementById('access-form');
const fields = [...form.querySelectorAll('input[name="digit"]')];

function distribute(value) {
  const digits = value.replace(/\D/g, '').slice(0, fields.length);
  fields.forEach((field, index) => { field.value = digits[index] || ''; });
  if (digits.length === fields.length) form.requestSubmit();
  else fields[digits.length]?.focus();
}

fields.forEach((field, index) => {
  field.addEventListener('input', () => {
    if (field.value.length > 1) return distribute(field.value);
    field.value = field.value.replace(/\D/g, '').slice(0, 1);
    if (field.value && index < fields.length - 1) fields[index + 1].focus();
    if (fields.every(input => input.value)) form.requestSubmit();
  });
  field.addEventListener('keydown', event => {
    if (event.key === 'Backspace' && !field.value && index > 0) fields[index - 1].focus();
  });
  field.addEventListener('paste', event => {
    const value = event.clipboardData.getData('text').replace(/\D/g, '');
    if (value.length > 1) {
      event.preventDefault();
      distribute(value);
    }
  });
});
