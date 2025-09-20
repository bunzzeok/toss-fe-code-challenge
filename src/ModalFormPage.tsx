import { useState } from "react";
import { openFormModal } from "./modal/openFormModal";

const ModalFormPage = () => {
  const [result, setResult] = useState<string | null>(null);

  async function handleOpen() {
    const res = await openFormModal();
    setResult(res ? res.email : null);
  }

  return (
    <div className="p-6">
      <h1 className="m-0 text-xl">접근성 모달 폼 데모</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        선언적 호출 API로 모달을 엽니다.
      </p>
      <button
        type="button"
        onClick={handleOpen}
        aria-haspopup="dialog"
        className="mt-3 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        모달 열기
      </button>
      <div className="mt-4 text-sm">
        결과: <span className="font-mono">{result ?? "(없음)"}</span>
      </div>
    </div>
  );
};

export default ModalFormPage;
