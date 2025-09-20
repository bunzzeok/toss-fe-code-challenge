import { openWithRender } from "./ModalHost";
import FormModal, { type FormResult } from "./FormModal";

export async function openFormModal(): Promise<FormResult | null> {
  return openWithRender<FormResult>(({ resolve, cancel }) => (
    <FormModal onResolve={resolve} onCancel={cancel} />
  ));
}
