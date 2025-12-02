import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

/**
 * 简单的Markdown渲染器
 * 处理常见格式并清理特殊字符
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // 清理和格式化内容
  const formatContent = (text: string): string => {
    if (!text) return '';

    // 移除多余的引号和特殊字符
    let formatted = text
      .replace(/^["']|["']$/g, '') // 移除首尾引号
      .replace(/\\n/g, '\n') // 转换换行符
      .replace(/\\t/g, '  ') // 转换制表符
      .replace(/\\\\/g, '\\') // 转换转义的反斜杠
      .trim();

    return formatted;
  };

  // 将文本转换为HTML（支持基本Markdown）
  const renderMarkdown = (text: string): React.ReactElement[] => {
    const formatted = formatContent(text);
    const lines = formatted.split('\n');
    const elements: React.ReactElement[] = [];
    let codeBlock: string[] = [];
    let inCodeBlock = false;
    let listItems: string[] = [];
    let inList = false;

    lines.forEach((line, index) => {
      // 代码块
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // 结束代码块
          elements.push(
            <pre key={`code-${index}`} className="code-block">
              <code>{codeBlock.join('\n')}</code>
            </pre>
          );
          codeBlock = [];
          inCodeBlock = false;
        } else {
          // 开始代码块
          if (inList) {
            elements.push(
              <ul key={`list-${index}`} className="markdown-list">
                {listItems.map((item, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                ))}
              </ul>
            );
            listItems = [];
            inList = false;
          }
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlock.push(line);
        return;
      }

      // 列表项
      if (/^[\-\*•]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim())) {
        if (!inList) {
          inList = true;
        }
        listItems.push(line.replace(/^[\-\*•]\s/, '').replace(/^\d+\.\s/, ''));
        return;
      } else if (inList) {
        // 结束列表
        elements.push(
          <ul key={`list-${index}`} className="markdown-list">
            {listItems.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }

      // 标题
      if (line.startsWith('###')) {
        elements.push(
          <h3 key={index} className="markdown-h3">
            {line.replace(/^###\s/, '')}
          </h3>
        );
      } else if (line.startsWith('##')) {
        elements.push(
          <h2 key={index} className="markdown-h2">
            {line.replace(/^##\s/, '')}
          </h2>
        );
      } else if (line.startsWith('#')) {
        elements.push(
          <h1 key={index} className="markdown-h1">
            {line.replace(/^#\s/, '')}
          </h1>
        );
      }
      // 空行
      else if (line.trim() === '') {
        elements.push(<br key={index} />);
      }
      // 普通段落
      else {
        elements.push(
          <p key={index} className="markdown-p" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        );
      }
    });

    // 处理未闭合的列表
    if (inList) {
      elements.push(
        <ul key="list-final" className="markdown-list">
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      );
    }

    return elements;
  };

  // 格式化内联元素（粗体、斜体、代码等）
  const formatInline = (text: string): string => {
    return text
      // 代码
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      // 粗体
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  };

  return <div className="markdown-content">{renderMarkdown(content)}</div>;
};
