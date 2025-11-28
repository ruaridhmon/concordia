import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { API_BASE_URL } from './config';

type Round = {
	id: number;
	round_number: number;
	synthesis: string;
	is_active: boolean;
	questions: string[];
};

type Form = {
	id: number;
	title: string;
	questions: string[];
	allow_join: boolean;
	join_code: string;
};

export default function SummaryPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const formId = Number(id);

	const token = useMemo(() => localStorage.getItem('access_token') || '', []);
	const authHeaders = useMemo(
		() => ({ Authorization: `Bearer ${token}` }),
		[token]
	);

	const [email, setEmail] = useState('');
	const [form, setForm] = useState<Form | null>(null);
	const [rounds, setRounds] = useState<Round[]>([]);
	const [activeRound, setActiveRound] = useState<Round | null>(null);
	const [loading, setLoading] = useState(false);

	const [responsesOpen, setResponsesOpen] = useState(false);
	const [responsesHTML, setResponsesHTML] = useState('');

	const [nextRoundQuestions, setNextRoundQuestions] = useState<string[]>([]);
	const [hasSavedSynthesis, setHasSavedSynthesis] = useState(false);

	const [selectedModel, setSelectedModel] = useState('openai/gpt-3.5-turbo');
	const [isGenerating, setIsGenerating] = useState(false);

	const models = [
		'openai/gpt-3.5-turbo',
		'google/gemini-pro',
		'anthropic/claude-2',
		'meta-llama/llama-2-70b-chat'
	];

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			Placeholder.configure({
				placeholder: 'Write the synthesis for this round…'
			})
		],
		content: '',
		editorProps: {
			attributes: {
				class: 'prose prose-neutral max-w-none focus:outline-none'
			}
		}
	});

	useEffect(() => {
		if (!token) return;
		fetch(`${API_BASE_URL}/me`, { headers: authHeaders })
			.then(r => r.json())
			.then(d => setEmail(d.email || ''));
	}, [token, authHeaders]);

	useEffect(() => {
		if (!token || !formId) return;
		loadAll();
	}, [token, formId, authHeaders, editor]);

	async function loadAll() {
		setLoading(true);
		try {
			const formRes = await fetch(`${API_BASE_URL}/forms/${formId}`, {
				headers: authHeaders
			});
			const f = await formRes.json();
			setForm(f);

			const roundsRes = await fetch(`${API_BASE_URL}/forms/${formId}/rounds`, {
				headers: authHeaders
			});
			const list = await roundsRes.json();

			const mapped: Round[] = (Array.isArray(list) ? list : []).map(
				(x: any) => ({
					id: x.id,
					round_number: x.round_number,
					synthesis: x.synthesis || '',
					is_active: !!x.is_active,
					questions: Array.isArray(x.questions) ? x.questions : []
				})
			);
			setRounds(mapped);

			const active = mapped.find(x => x.is_active) || null;
			setActiveRound(active || null);

			if (active && editor) {
				editor.commands.setContent(active.synthesis || '');
				setHasSavedSynthesis(
					!!(active.synthesis && active.synthesis.trim().length > 0)
				);

				if (active.questions && active.questions.length) {
					setNextRoundQuestions(active.questions);
				} else if (Array.isArray(f.questions)) {
					setNextRoundQuestions(f.questions);
				}
			} else if (f && Array.isArray(f.questions)) {
				setNextRoundQuestions(f.questions);
			}
		} finally {
			setLoading(false);
		}
	}

	function logout() {
		localStorage.clear();
		navigate('/');
	}

	async function viewAllResponses() {
		if (responsesOpen) {
			setResponsesOpen(false);
			return;
		}

		const roundsWithResponses = await fetch(
			`${API_BASE_URL}/forms/${formId}/rounds_with_responses`,
			{ headers: authHeaders }
		).then(r => r.json());

		let html = '';
		if (!roundsWithResponses || roundsWithResponses.length === 0) {
			html = '<p class="text-neutral-600">No responses yet for this form.</p>';
		} else {
			for (const round of roundsWithResponses) {
				html += `<div class="mb-8 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                            <h2 class="text-xl font-bold mb-3 text-neutral-800">Round ${round.round_number}</h2>`;

				if (round.responses.length === 0) {
					html += '<p class="text-neutral-600">No responses for this round.</p>';
					html += `</div>`; // Close round div
					continue;
				}

				const questions =
					rounds.find(r => r.id === round.id)?.questions ||
					form?.questions ||
					[];

				// Group responses by question for better readability
				for (let i = 0; i < questions.length; i++) {
					const question = questions[i];
					const questionKey = `q${i + 1}`;
					html += `<div class="mb-6 p-3 border-l-4 border-neutral-300 bg-white shadow-sm rounded">
                                <h3 class="text-lg font-semibold mb-2 text-neutral-700">${question}</h3>`;

					let hasAnswers = false;
					for (const response of round.responses) {
						const answer = response.answers[questionKey];
						if (answer) {
							hasAnswers = true;
							html += `
                                <div class="pl-4 py-2 my-2 border-t border-neutral-100 last:border-b-0">
                                    <p class="text-base text-neutral-800 leading-relaxed">${answer}</p>
                                    <p class="text-xs text-neutral-500 mt-1 italic">
                                        – ${response.email || 'Anonymous'}
                                    </p>
                                </div>
                            `;
						}
					}
					if (!hasAnswers) {
						html += `<p class="text-sm text-neutral-500 italic">No responses for this question.</p>`;
					}
					html += `</div>`; // Close question div
				}
				html += `</div>`; // Close round div
			}
		}

		setResponsesHTML(html);
		setResponsesOpen(true);
	}

	async function saveSynthesis() {
		if (!activeRound || !formId) return;
		const summary = editor?.getHTML() || '';

		await fetch(`${API_BASE_URL}/forms/${formId}/push_summary`, {
			method: 'POST',
			headers: { ...authHeaders, 'Content-Type': 'application/json' },
			body: JSON.stringify({ summary })
		});

		setHasSavedSynthesis(true);
	}

	function updateNextQuestion(index: number, value: string) {
		setNextRoundQuestions(prev => {
			const copy = [...prev];
			copy[index] = value;
			return copy;
		});
	}

	function addNextQuestion() {
		setNextRoundQuestions(prev => [...prev, '']);
	}

	function removeNextQuestion(index: number) {
		setNextRoundQuestions(prev => prev.filter((_, i) => i !== index));
	}

	async function startNextRound() {
		if (!formId) return;

		const cleaned = nextRoundQuestions
			.map(q => q.trim())
			.filter(q => q.length > 0);
		if (!cleaned.length) {
			alert('Add at least one question for the next round.');
			return;
		}

		await fetch(`${API_BASE_URL}/forms/${formId}/next_round`, {
			method: 'POST',
			headers: { ...authHeaders, 'Content-Type': 'application/json' },
			body: JSON.stringify({ questions: cleaned })
		});

		await loadAll();
		setHasSavedSynthesis(false);
	}

	async function downloadResponses() {
		const raw = await fetch(
			`${API_BASE_URL}/form/${formId}/responses?all_rounds=true`,
			{ headers: authHeaders }
		).then(r => r.json());

		if (!Array.isArray(raw) || raw.length === 0) {
			alert('No responses to download');
			return;
		}

		const paragraphs = raw.flatMap((r: any, i: number) => {
			const header = new Paragraph({
				children: [new TextRun({ text: `Response ${i + 1}`, bold: true })],
				spacing: { after: 200 }
			});

			const qa = Object.entries(r.answers).flatMap(([k, v]: any) => [
				new Paragraph({
					children: [new TextRun({ text: k, bold: true })],
					spacing: { after: 80 }
				}),
				new Paragraph({
					text: String(v ?? ''),
					spacing: { after: 160 }
				})
			]);

			return [header, ...qa, new Paragraph('')];
		});

		const doc = new Document({ sections: [{ children: paragraphs }] });
		const blob = await Packer.toBlob(doc);
		saveAs(blob, 'responses.docx');
	}

	async function generateSummary() {
		if (!formId || !selectedModel) return;

		setIsGenerating(true);
		try {
			const res = await fetch(
				`${API_BASE_URL}/forms/${formId}/generate_summary`,
				{
					method: 'POST',
					headers: { ...authHeaders, 'Content-Type': 'application/json' },
					body: JSON.stringify({ model: selectedModel })
				}
			);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.detail || 'Failed to generate summary');
			}

			const data = await res.json();
			if (data.summary && editor) {
				editor.commands.setContent(data.summary);
			}
		} catch (error) {
			console.error('Error generating summary:', error);
			alert((error as Error).message);
		} finally {
			setIsGenerating(false);
		}
	}

	if (!form) return <div>Loading…</div>;

	return (
		<div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans flex flex-col">
			<header className="bg-white border-b shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
					<div>
						<h1 className="text-xl font-bold tracking-tight">Admin Workspace</h1>
						<p className="text-sm text-neutral-500">
							Logged in as <strong>{email}</strong>
						</p>
					</div>
					<button onClick={logout} className="text-sm text-red-600 underline">
						Log out
					</button>
				</div>
			</header>

			<main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div className="mb-4">
					<button
						onClick={() => navigate('/')}
						className="text-sm text-blue-600 underline"
					>
						← Back to Dashboard
					</button>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						<div className="bg-white border shadow rounded-xl p-6 min-h-[200px] lg:min-h-[300px]">
							<h2 className="text-lg font-semibold mb-3">
								Synthesis for Round {activeRound?.round_number || ''}
							</h2>
							<div className="prose max-w-none">
								<EditorContent editor={editor} />
							</div>
						</div>

						<div className="bg-white border shadow rounded-xl p-6">
							<h2 className="text-lg font-semibold">Next Round Questions</h2>
							<div className="space-y-3">
								{nextRoundQuestions.map((q, index) => (
									<div key={index} className="flex gap-2 items-center">
										<input
											type="text"
											className="flex-1 border rounded px-3 py-2 text-sm"
											value={q}
											onChange={e => updateNextQuestion(index, e.target.value)}
											placeholder={`Question ${index + 1}`}
										/>
										<button
											className="px-3 py-2 rounded bg-red-100 text-red-700 text-sm hover:bg-red-200"
											onClick={() => removeNextQuestion(index)}
										>
											Remove
										</button>
									</div>
								))}
							</div>
							<button
								onClick={addNextQuestion}
								className="mt-4 px-3 py-1 rounded bg-neutral-800 text-white text-sm hover:bg-neutral-900"
							>
								Add Question
							</button>
						</div>
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-1 space-y-6">
						<div className="bg-white border shadow rounded-xl p-4">
							<h3 className="text-base font-semibold mb-2">Form Info</h3>
							<div className="text-sm space-y-1">
								<div>
									<strong>Form:</strong> {form.title}
								</div>
								<div>
									<strong>Active round:</strong>{' '}
									{activeRound ? `Round ${activeRound.round_number}` : 'None'}
								</div>
							</div>
						</div>
						<div className="bg-white border shadow rounded-xl p-4">
							<h3 className="text-base font-semibold mb-3">Actions</h3>
							<div className="flex flex-col space-y-2">
								<button
									onClick={viewAllResponses}
									className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
								>
									{responsesOpen ? 'Hide Responses' : 'View All Responses'}
								</button>
								<button
									onClick={downloadResponses}
									className="w-full text-left bg-neutral-700 hover:bg-neutral-800 text-white px-3 py-2 rounded text-sm"
								>
									Download Responses
								</button>
								<button
									className="w-full text-left bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm"
									onClick={saveSynthesis}
								>
									Save Synthesis
								</button>
								<div className="pt-2">
									<button
										onClick={startNextRound}
										className="w-full bg-blue-800 hover:bg-blue-900 text-white px-3 py-2 rounded font-semibold"
										disabled={loading}
									>
										Start Next Round
									</button>
								</div>
							</div>
						</div>

						<div className="bg-white border shadow rounded-xl p-4">
							<h3 className="text-base font-semibold mb-3">AI-Powered Synthesis</h3>
							<div className="space-y-3">
								<div>
									<label htmlFor="model-select" className="block text-sm font-medium text-neutral-700 mb-1">
										Choose a model
									</label>
									<select
										id="model-select"
										className="w-full border rounded px-3 py-2 text-sm"
										value={selectedModel}
										onChange={e => setSelectedModel(e.target.value)}
									>
										{models.map(model => (
											<option key={model} value={model}>
												{model}
											</option>
										))}
									</select>
								</div>
								<button
									onClick={generateSummary}
									className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded font-semibold text-sm"
									disabled={isGenerating}
								>
									{isGenerating ? 'Generating...' : 'Generate Summary'}
								</button>
							</div>
						</div>

						{rounds.length > 0 && (
							<div className="bg-white border shadow rounded-xl p-4">
								<h3 className="text-base font-semibold mb-2">Round History</h3>
								<ul className="text-sm space-y-1">
									{rounds.map(r => (
										<li
											key={r.id}
											className="flex justify-between items-center border-b last:border-b-0 py-1"
										>
											<span>
												Round {r.round_number}{' '}
												{r.is_active && (
													<span className="text-green-600 font-semibold">
														(active)
													</span>
												)}
											</span>
											<span
												className={`text-xs px-2 py-0.5 rounded-full ${
													r.synthesis
														? 'bg-green-100 text-green-700'
														: 'bg-neutral-100 text-neutral-500'
												}`}
											>
												{r.synthesis ? 'Synthesis' : 'No Synthesis'}
											</span>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>
			</main>

			{responsesOpen &&
				createPortal(
					<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
						<div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-6 text-left">
							<h3 className="text-xl font-semibold mb-4 text-neutral-800">All Responses</h3>
							<div
								className="prose prose-sm max-w-none custom-prose"
								dangerouslySetInnerHTML={{ __html: responsesHTML }}
							/>
							<button
								className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
								onClick={() => setResponsesOpen(false)}
							>
								Close
							</button>
						</div>
					</div>,
					document.body
				)}

			<footer className="bg-white border-t text-center py-4 text-sm text-neutral-500 mt-8">
				© {new Date().getFullYear()} – Summary workspace
			</footer>
		</div>
	);
}
