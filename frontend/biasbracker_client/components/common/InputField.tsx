import React from "react";

interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  name: string;
  value: string;
  error?: string;
  touched?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  autoComplete?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type,
  name,
  value,
  error,
  touched,
  onChange,
  autoFocus = false,
  autoComplete = "off",
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
          error && touched ? "border-red-500" : "border-gray-300"
        }`}
        required
      />
      {error && touched && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default InputField;
