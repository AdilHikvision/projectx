import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/AuthContext';
import { apiRequest } from '../../../lib/api';
import { Logo } from '../../atoms';

interface AssistantAction {
    tool: string;
    summary: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    actions?: AssistantAction[];
    isError?: boolean;
}

interface AssistantChatResponse {
    reply: string;
    actions: AssistantAction[];
}

/**
 * Плавающий ИИ-ассистент: кнопка в правом нижнем углу + панель чата.
 * Команды выполняются на сервере (поиск людей, графики, отчёты) через Claude API.
 */
export function AssistantChat() {
    const { t } = useTranslation();
    const { token, isAuthenticated } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [status, setStatus] = useState<{ enabled: boolean; configured: boolean } | null>(null);

    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const statusFetchedRef = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || !token || statusFetchedRef.current) return;
        statusFetchedRef.current = true;
        apiRequest<{ enabled: boolean; configured: boolean }>('/api/assistant/status', { token })
            .then(setStatus)
            .catch(() => setStatus({ enabled: true, configured: true }));
    }, [isAuthenticated, token]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isThinking]);

    if (!isAuthenticated) return null;
    if (status?.enabled === false) return null;

    async function send() {
        const text = input.trim();
        if (!text || isThinking) return;

        const history = [...messages, { role: 'user' as const, content: text }];
        setMessages(history);
        setInput('');
        setIsThinking(true);

        try {
            const response = await apiRequest<AssistantChatResponse>('/api/assistant/chat', {
                method: 'POST',
                token,
                body: JSON.stringify({
                    messages: history.map(m => ({ role: m.role, content: m.content })),
                }),
            });
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.reply,
                actions: response.actions,
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: error instanceof Error ? error.message : t('assistant.error'),
                isError: true,
            }]);
        } finally {
            setIsThinking(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void send();
        }
    }

    return (
        <>
            {/* Плавающая кнопка */}
            <button
                type="button"
                onClick={() => setIsOpen(o => !o)}
                title={t('assistant.title')}
                className={`fixed bottom-20 md:bottom-6 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full text-white shadow-primary transition-all hover:scale-105 active:scale-95 ${isOpen ? 'bg-text-dark' : 'bg-brand-gradient'}`}
            >
                <span className="material-symbols-outlined text-2xl icon-fill">
                    {isOpen ? 'close' : 'auto_awesome'}
                </span>
            </button>

            {/* Панель чата */}
            {isOpen && (
                <div className="animate-pop fixed bottom-36 md:bottom-22 right-5 z-40 flex w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border-light bg-white shadow-float"
                    style={{ height: 'min(560px, calc(100dvh - 12rem))' }}
                >
                    {/* Шапка */}
                    <div className="flex items-center gap-3 border-b border-border-light bg-slate-75/60 px-4 py-3">
                        <Logo size={32} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-extrabold tracking-tight text-text-dark leading-tight">{t('assistant.title')}</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-light">{t('assistant.subtitle')}</p>
                        </div>
                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setMessages([])}
                                title={t('assistant.clear')}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-light transition-colors hover:bg-slate-75 hover:text-text-dark"
                            >
                                <span className="material-symbols-outlined text-[18px]">mop</span>
                            </button>
                        )}
                    </div>

                    {/* Сообщения */}
                    <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                        {messages.length === 0 && (
                            <div className="mt-6 space-y-3 text-center">
                                <span className="material-symbols-outlined text-4xl text-primary/40 icon-fill">auto_awesome</span>
                                <p className="text-sm font-semibold text-text-muted">{t('assistant.intro')}</p>
                                {status?.configured === false && (
                                    <p className="text-[11px] font-semibold text-text-light">{t('assistant.notConfigured')}</p>
                                )}
                                <div className="space-y-1.5 pt-1">
                                    {[t('assistant.example1'), t('assistant.example2'), t('assistant.example3')].map(example => (
                                        <button
                                            key={example}
                                            type="button"
                                            onClick={() => { setInput(example); inputRef.current?.focus(); }}
                                            className="block w-full rounded-xl border border-border-light bg-slate-75/50 px-3 py-2 text-left text-xs font-semibold text-text-base transition-colors hover:border-primary/30 hover:bg-primary/5"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message, i) => (
                            <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${message.role === 'user'
                                    ? 'bg-brand-gradient text-white rounded-br-md'
                                    : message.isError
                                        ? 'bg-error-bg text-error-text rounded-bl-md font-semibold'
                                        : 'bg-slate-75 text-text-dark rounded-bl-md'
                                    }`}
                                >
                                    {message.content}
                                    {message.actions && message.actions.length > 0 && (
                                        <div className="mt-2 space-y-1 border-t border-border-base/60 pt-2">
                                            {message.actions.map((action, j) => (
                                                <div key={j} className="flex items-start gap-1.5 text-[11px] font-semibold text-text-muted">
                                                    <span className="material-symbols-outlined mt-px shrink-0 text-[13px] text-primary">bolt</span>
                                                    <span>{action.summary}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-slate-75 px-3.5 py-2.5">
                                    <span className="spinner-ring text-[16px] text-primary" aria-hidden="true" />
                                    <span className="text-xs font-semibold text-text-muted">{t('assistant.thinking')}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Ввод */}
                    <div className="border-t border-border-light p-3">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('assistant.placeholder')}
                                disabled={isThinking}
                                className="h-10 flex-1 rounded-xl border border-transparent bg-slate-75 px-3.5 text-sm font-semibold text-text-dark outline-none transition-all placeholder:text-text-light focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
                            />
                            <button
                                type="button"
                                onClick={() => void send()}
                                disabled={!input.trim() || isThinking}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-primary transition-all hover:brightness-110 disabled:opacity-40"
                            >
                                <span className="material-symbols-outlined text-[20px]">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
