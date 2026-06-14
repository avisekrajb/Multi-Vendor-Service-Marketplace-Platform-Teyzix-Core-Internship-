export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhone = (phone) => {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateName = (name) => {
  return name.trim().length >= 2;
};

export const validateBudget = (budget) => {
  return budget >= 100 && budget <= 1000000;
};

export const validateDeadline = (deadline) => {
  const selected = new Date(deadline);
  const today = new Date();
  return selected >= today;
};