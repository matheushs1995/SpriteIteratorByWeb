import { ChangeEvent, useMemo, useState } from 'react';

type SpriteAnimation = {
  id: string;
  name: string;
  src: string;
  links: string[];
};

type Mode = 'admin' | 'play';

const createId = () => crypto.randomUUID();

export function App() {
  const [mode, setMode] = useState<Mode>('admin');
  const [animations, setAnimations] = useState<SpriteAnimation[]>([]);
  const [rootId, setRootId] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const rootAnimation = useMemo(
    () => animations.find((animation) => animation.id === rootId) ?? null,
    [animations, rootId]
  );

  const currentAnimation = useMemo(
    () => animations.find((animation) => animation.id === currentId) ?? null,
    [animations, currentId]
  );

  const addAnimation = (file: File) => {
    const id = createId();
    const newAnimation: SpriteAnimation = {
      id,
      name: file.name,
      src: URL.createObjectURL(file),
      links: []
    };

    setAnimations((previousAnimations) => {
      if (previousAnimations.length === 0) {
        setRootId(id);
        setCurrentId(id);
      }

      return [...previousAnimations, newAnimation];
    });
  };

  const onUploadAnimation = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    addAnimation(selectedFile);
    event.target.value = '';
  };

  const addLink = (fromAnimationId: string, toAnimationId: string) => {
    if (fromAnimationId === toAnimationId) {
      return;
    }

    setAnimations((previousAnimations) =>
      previousAnimations.map((animation) => {
        if (animation.id !== fromAnimationId) {
          return animation;
        }

        if (animation.links.includes(toAnimationId)) {
          return animation;
        }

        return {
          ...animation,
          links: [...animation.links, toAnimationId]
        };
      })
    );
  };

  const goToAnimation = (targetId: string) => {
    if (!currentId || targetId === currentId) {
      return;
    }

    setHistory((previousHistory) => [...previousHistory, currentId]);
    setCurrentId(targetId);
  };

  const goBack = () => {
    setHistory((previousHistory) => {
      const previousId = previousHistory[previousHistory.length - 1];
      if (!previousId) {
        return previousHistory;
      }

      setCurrentId(previousId);
      return previousHistory.slice(0, -1);
    });
  };

  return (
    <main className="app">
      <div className="phone">
        <header className="header">
          <h1>Sprite Iterator</h1>
          <div className="tabs">
            <button
              className={mode === 'admin' ? 'active' : ''}
              onClick={() => setMode('admin')}
              type="button"
            >
              Admin
            </button>
            <button
              className={mode === 'play' ? 'active' : ''}
              onClick={() => setMode('play')}
              type="button"
              disabled={!rootAnimation}
            >
              Interação
            </button>
          </div>
        </header>

        {mode === 'admin' ? (
          <section className="panel">
            <h2>Configuração das animações</h2>
            <label className="upload">
              <span>Adicionar Sprite</span>
              <input type="file" accept="image/*" onChange={onUploadAnimation} />
            </label>

            {animations.length === 0 ? (
              <p className="hint">Nenhum sprite ainda. Comece adicionando o primeiro.</p>
            ) : (
              <div className="list">
                {animations.map((animation) => (
                  <article key={animation.id} className="card">
                    <img src={animation.src} alt={animation.name} />
                    <h3>{animation.name}</h3>
                    <p>{animation.id === rootId ? 'Animação inicial (loop)' : 'Animação vinculada'}</p>

                    <label>
                      Vincular para:
                      <select
                        defaultValue=""
                        onChange={(event) => {
                          const targetId = event.target.value;
                          if (targetId) {
                            addLink(animation.id, targetId);
                          }
                        }}
                      >
                        <option value="" disabled>
                          Selecione
                        </option>
                        {animations
                          .filter((option) => option.id !== animation.id)
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                      </select>
                    </label>

                    <small>
                      Links: {animation.links.length > 0 ? animation.links.length : 'sem links'}
                    </small>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="panel">
            <h2>Tela de interação</h2>
            {!currentAnimation ? (
              <p className="hint">Nenhuma animação selecionada.</p>
            ) : (
              <>
                <figure className="viewer">
                  <img src={currentAnimation.src} alt={currentAnimation.name} />
                  <figcaption>{currentAnimation.name} (loop)</figcaption>
                </figure>

                <div className="actions">
                  <button type="button" onClick={goBack} disabled={history.length === 0}>
                    Voltar
                  </button>
                  {currentAnimation.links.map((linkedId) => {
                    const linkedAnimation = animations.find((animation) => animation.id === linkedId);
                    if (!linkedAnimation) {
                      return null;
                    }

                    return (
                      <button key={linkedId} type="button" onClick={() => goToAnimation(linkedId)}>
                        Ir para {linkedAnimation.name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
