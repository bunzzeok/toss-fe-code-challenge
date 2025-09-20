import { useEffect, useId, useRef, useState } from "react";

type FormResult = { email: string };

type Props = {
  onResolve: (value: FormResult) => void;
  onCancel: () => void;
};

export default function FormModal({ onResolve, onCancel }: Props) {
  const titleId = useId();
  const descId = useId();
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function isValidEmail(value: string) {
    return /.+@.+\..+/.test(value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (value.length === 0) {
      setError("이메일을 입력해 주세요.");
      inputRef.current?.focus();
      return;
    }
    if (!isValidEmail(value)) {
      setError("올바른 이메일 형식을 입력해 주세요.");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    onResolve({ email: value });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (error) setError(null);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className="flex items-center justify-between">
        <h2
          id={titleId}
          ref={titleRef}
          tabIndex={-1}
          className="m-0 text-lg font-semibold outline-none"
        >
          폼 모달
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="모달 닫기"
          className="rounded px-2 py-1 text-sm hover:bg-zinc-100 focus-visible:outline focus-visible:outline-blue-500 dark:hover:bg-zinc-800"
        >
          닫기
        </button>
      </div>
      <p id={descId} className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
        데모: 제출 시 이메일 값을 반환하고, 취소/닫기 시 null을 반환합니다.
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm">이메일</span>
          <input
            ref={inputRef}
            name="email"
            type="email"
            value={email}
            onChange={handleInputChange}
            aria-invalid={error ? true : false}
            aria-describedby={error ? `${descId} ${errorId}` : descId}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">이름 (선택)</span>
          <input
            name="name"
            type="text"
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded bg-zinc-100 px-3 py-2 text-sm hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            취소
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          >
            제출
          </button>
        </div>
      </form>
    </div>
  );
}

export type { FormResult };
