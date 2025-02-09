import React, { useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";

interface PasswordFieldProps {
  id: string;
  label: string;
  name: string;
  value: string;
  error?: string;
  touched?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  name,
  value,
  error,
  touched,
  onChange,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
          required
        />
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500"
          onClick={() => setVisible(!visible)}
        >
          {visible ? <HiEyeOff size={20} /> : <HiEye size={20} />}
        </button>
      </div>
      {error && touched && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default PasswordField;
