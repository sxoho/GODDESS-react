// src/pages/chat/Chat.tsx
import React, {useEffect, useRef, useState} from 'react';
import {useChatRoomList, useCreateChatRoom, useFaqList, useMessageList, useSendMessage} from '../../features/useChat';
import '../../styles/chat/Chat.css';

const Chat: React.FC = () => {
    const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {data: faqs} = useFaqList();
    const {data: chatRooms} = useChatRoomList();
    const {data: messages} = useMessageList(activeRoomId);

    const createRoomMutation = useCreateChatRoom();
    const sendMessageMutation = useSendMessage(activeRoomId || 0);

    // 메시지 업데이트 시 자동 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const handleStartChat = () => {
        createRoomMutation.mutate(
            {chatType: 'LIVE_CHAT'},
            {onSuccess: (data) => setActiveRoomId(data.chatRoomId)}
        );
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeRoomId) return;

        sendMessageMutation.mutate({message: inputText, messageType: 'TEXT'});
        setInputText('');
    };

    return (
        <div className="chat-container">
            {/* 좌측 사이드바: FAQ 및 채팅방 목록 */}
            <aside className="chat-sidebar">
                <div className="sidebar-section">
                    <h3>고객센터 FAQ</h3>
                    <ul className="faq-list">
                        {faqs?.map((faq) => (
                            <li key={faq.faqId} className="faq-item">
                                <span className="faq-q">Q. {faq.question}</span>
                                <span className="faq-a">{faq.answer}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="sidebar-section">
                    <h3>내 채팅 상담</h3>
                    <button className="btn-new-chat" onClick={handleStartChat} disabled={createRoomMutation.isPending}>
                        + 새 상담 시작하기
                    </button>
                    <ul className="room-list">
                        {chatRooms?.map((room) => (
                            <li
                                key={room.chatRoomId}
                                className={`room-item ${activeRoomId === room.chatRoomId ? 'active' : ''}`}
                                onClick={() => setActiveRoomId(room.chatRoomId)}
                            >
                                상담방 #{room.chatRoomId} ({room.chatType})
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            {/* 우측 메인 영역: 메시지 뷰어 */}
            <main className="chat-main">
                {!activeRoomId ? (
                    <div className="chat-placeholder">
                        <p>상담을 원하시면 좌측에서 새 상담을 시작해주세요.</p>
                    </div>
                ) : (
                    <div className="chat-window">
                        <div className="chat-header">
                            <h3>상담방 #{activeRoomId}</h3>
                        </div>

                        <div className="chat-messages">
                            {messages?.map((msg) => {
                                const isMine = msg.senderType === 'USER';
                                return (
                                    <div key={msg.chatMessageId}
                                         className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                                        <div className="message-bubble">
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef}/>
                        </div>

                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder="메시지를 입력하세요..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={sendMessageMutation.isPending}
                            />
                            <button type="submit" disabled={sendMessageMutation.isPending || !inputText.trim()}>
                                전송
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Chat;