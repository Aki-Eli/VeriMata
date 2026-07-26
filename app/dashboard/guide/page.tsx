'use client'

import { BookOpen, Brain, Eye, Lightbulb } from 'lucide-react'

const guides = [
  {
    icon: Brain,
    title: 'Common AI Patterns',
    description: 'Learn to recognize common tells that reveal AI-generated content',
    points: [
      'Overly perfect grammar and structure',
      'Generic or repetitive phrases',
      'Lack of personal anecdotes or specific details',
      'Numbered lists and bullet points in unnatural places',
      'Consistent tone and style that feels robotic',
    ],
  },
  {
    icon: Eye,
    title: 'Visual Flaws in Images',
    description: 'AI images often have characteristic artifacts and inconsistencies',
    points: [
      'Distorted hands or fingers (common AI weakness)',
      'Unusual eye reflections or light patterns',
      'Inconsistent textures or gradients',
      'Strange object blending or layering',
      'Unnatural hair strands or fabric patterns',
    ],
  },
  {
    icon: Lightbulb,
    title: 'Misinformation Red Flags',
    description: 'Spot misinformation with these helpful techniques',
    points: [
      'Check multiple sources for the same story',
      'Look for author information and credentials',
      'Verify images with reverse image search',
      'Watch for emotionally manipulative language',
      'Question sources that lack citations',
    ],
  },
  {
    icon: BookOpen,
    title: 'How Spot the Bot Works',
    description: 'Master the game mechanics and scoring system',
    points: [
      '5 questions per daily quiz',
      '10 XP per correct answer (base)',
      'Streak bonus: XP multiplied by streak length',
      'Accuracy tracked over time',
      'Badges unlock at different XP thresholds',
    ],
  },
]

const tips = [
  {
    title: 'Read Carefully',
    description:
      'Take your time to analyze both pieces of content. Look for subtle differences in tone, structure, and detail.',
  },
  {
    title: 'Trust Your Gut (Sometimes)',
    description:
      'AI-generated text often feels "off" even if you can&apos;t pinpoint why. Intuition combined with analysis is powerful.',
  },
  {
    title: 'Look for Context',
    description:
      'AI often lacks real-world experience. Specific details, personal stories, and unique perspectives tend to be human.',
  },
  {
    title: 'Spot Inconsistencies',
    description:
      'AI sometimes contradicts itself or uses conflicting information. Humans are usually more internally consistent.',
  },
  {
    title: 'Use the Explanations',
    description:
      'After each question, read the explanation. This helps you learn patterns and improve for future quizzes.',
  },
  {
    title: 'Build Your Streak',
    description:
      'Play daily to maintain your streak. The more you play, the better your intuition becomes for spotting AI.',
  },
]

export default function GuidePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Learning Guide</h1>
          </div>
          <p className="text-muted-foreground text-lg">Master the art of detecting AI-generated content</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 py-12">
        {/* Main Guides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {guides.map((guide, idx) => {
            const Icon = guide.icon
            return (
              <div key={idx} className="bg-card border border-border rounded-lg p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{guide.title}</h2>
                </div>

                <p className="text-muted-foreground mb-6">{guide.description}</p>

                <ul className="space-y-3">
                  {guide.points.map((point, pointIdx) => (
                    <li key={pointIdx} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                      <span className="text-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Quick Tips */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Pro Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, idx) => (
              <div key={idx} className="bg-gradient-to-br from-secondary/10 to-accent/10 border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{tip.title}</h3>
                <p className="text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition">
              <summary className="flex items-center justify-between font-semibold text-foreground">
                <span>How often should I play?</span>
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="text-muted-foreground mt-4">
                Play daily to maintain your streak and build your AI detection skills. Each quiz takes about 5 minutes,
                making it perfect for a quick daily challenge.
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition">
              <summary className="flex items-center justify-between font-semibold text-foreground">
                <span>What happens if I miss a day?</span>
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="text-muted-foreground mt-4">
                Your streak will reset to 0 if you miss a day. Don&apos;t worry though—streaks are meant to motivate
                you, and you can always start a new one!
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition">
              <summary className="flex items-center justify-between font-semibold text-foreground">
                <span>How is XP calculated?</span>
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="text-muted-foreground mt-4">
                You earn 10 XP per correct answer. Additionally, your daily streak acts as a multiplier—a 5-day streak
                means each correct answer is worth 50 XP (10 × 5). The longer your streak, the more XP you earn!
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition">
              <summary className="flex items-center justify-between font-semibold text-foreground">
                <span>Can I retake yesterday&apos;s quiz?</span>
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="text-muted-foreground mt-4">
                Currently, you can only take the daily quiz once per day. Previous quizzes are archived for your
                reference. In future updates, we may add the ability to review past quizzes.
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition">
              <summary className="flex items-center justify-between font-semibold text-foreground">
                <span>How do I earn badges?</span>
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="text-muted-foreground mt-4">
                Badges unlock automatically when you reach certain milestones. Examples include completing your first
                quiz, maintaining a 7-day streak, or reaching specific XP thresholds. Check your profile to see which
                badges you&apos;ve earned!
              </p>
            </details>
          </div>
        </section>
      </div>
    </div>
  )
}
