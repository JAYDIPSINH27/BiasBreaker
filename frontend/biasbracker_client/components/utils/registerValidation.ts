export const validateForm = (formData: any) => {
    let errors: any = {};
    const { first_name, last_name, email, password, re_password } = formData;
  
    if (!/^[A-Za-z]{2,}$/.test(first_name)) {
      errors.first_name = "Must be at least 2 letters";
    }
  
    if (!/^[A-Za-z]{2,}$/.test(last_name)) {
      errors.last_name = "Must be at least 2 letters";
    }
  
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format";
    }
  
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      errors.password = "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char";
    }
  
    if (re_password !== password) {
      errors.re_password = "Passwords do not match";
    }
  
    return errors;
  };
  