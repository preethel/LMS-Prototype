import { Attachment } from "@/lib/types";

interface AttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: Attachment[];
}

export default function AttachmentsModal({
  isOpen,
  onClose,
  attachments,
}: AttachmentsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Attachments</h2>
            <p className="text-sm text-gray-500">
              {attachments.length} {attachments.length === 1 ? "file" : "files"}{" "}
              attached
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {attachments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No attachments found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50/50 transition-colors border border-gray-100 group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl shadow-sm border border-gray-100">
                      📄
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {file.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {file.type} • {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    download={file.name}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
