export const validateLoginForm = (formData: any) => {
    let errors: any = {};
    const { email, password } = formData;
  
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format";
    }
  
    if (!password) {
      errors.password = "Password is required";
    }
  
    return errors;
  };
  