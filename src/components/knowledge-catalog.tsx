"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Search } from "lucide-react";
import { knowledgeTopics } from "@/lib/knowledge/content";
import { searchKnowledge } from "@/lib/knowledge/retrieval";
export function KnowledgeCatalog() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const results = searchKnowledge(query, topic);
  return (
    <>
      <div className="panel knowledge-controls">
        <label className="form-field">
          <span>
            <Search size={15} /> Search approved topics
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try sleep, microgravity or radiation"
          />
        </label>
        <div className="form-field">
          <label htmlFor="knowledge-topic">Topic</label>
          <select
            id="knowledge-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          >
            <option value="all">All topics</option>
            {knowledgeTopics.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="knowledge-count" role="status">
        {results.length} curated topics · NASA HRP & Canadian Space Agency
      </p>
      <div className="knowledge-grid">
        {results.map(({ entry }) => (
          <article className="panel knowledge-card" key={entry.id}>
            <div className="knowledge-card-top">
              <BookOpen size={20} />
              <span>{entry.topic}</span>
            </div>
            <h2>
              <Link href={`/space-health-knowledge/${entry.id}`}>
                {entry.title}
              </Link>
            </h2>
            <p>{entry.summary}</p>
            <div className="knowledge-tags">
              {entry.hazards.map((hazard) => (
                <span key={hazard}>{hazard}</span>
              ))}
            </div>
            <div className="knowledge-card-footer">
              <small>{entry.organization}</small>
              <Link
                href={`/space-health-knowledge/${entry.id}`}
                aria-label={`Explore ${entry.title}`}
              >
                Explore <ArrowUpRight size={15} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!results.length && (
        <div className="panel knowledge-empty">
          <h2>No matching curated topic</h2>
          <p>
            Try a broader term or choose all topics. Search covers this
            collection only.
          </p>
        </div>
      )}
    </>
  );
}
