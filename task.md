# Proje 1: TaskFlow — Kanban Proje Yönetim Tahtası

## Senaryo

Küçük bir yazılım ekibi, Trello benzeri basit ama etkili bir görev yönetim aracına ihtiyaç duyuyor. Ekip üyeleri görevleri sütunlar arasında sürükleyerek durumunu güncelleyebilmeli.

## Hedef

Kullanıcıların board oluşturup sütun ve kartlarla görev yönetebildiği, sürükle-bırak ile kartları taşıyabildiği çalışan bir web uygulaması geliştir.

## Beklentiler

- Kullanıcılar hesap oluşturup giriş yapabilmeli

- Board oluşturulabilmeli, sütunlar ve kartlar eklenebilmeli

- Kartlar sürükle-bırak ile sütunlar arasında taşınabilmeli

- Kart detayları (başlık, açıklama) düzenlenebilmeli

- Sıralama sayfa yenilemesinde korunmalı

- Uygulama Vercel'da çalışır durumda olmalı

## Düşünmen Gereken Sorular

- Sürükle-bırak kütüphanesi seçimi: dnd-kit, @hello-pangea/dnd, SortableJS, veya tarayıcı yerleşik drag-and-drop? Her birinin artı-eksileri neler? (Hız, mobil uyumluluğu, dosya boyutu, destek durumu)

- Sıralama verisi nasıl saklanmalı? Sayfa yenileseniz bile kartların sırası kaybolmaması kritik — bunu nasıl çözersin?

- Mobil cihazlarda sürükle-bırak nasıl çalışacak? Uzun basma mı, alternatif bir mekanizma mı? Mobil uygulama yazmanı beklemiyoruz ama uygulama tasarımının mobil cihazlarda düzgün görünmesini bekliyoruz.

- Sütunların sırası da değiştirilebilir mi olmalı?

- Kartlara etiket, son teslim tarihi, sorumlu kişi eklemeyi düşünecek misin? Hangisi 48 saatte çalışmaya değer?

- Board paylaşma özelliği olacak mı? Varsa sadece görüntüleme mi, yoksa birlikte düzenleme mi?

- Aktivite geçmişi (kartın hangi sütunlar arasında ne zaman taşındığı) değerli mi?

- Performans: çok sayıda kart olduğunda sürükle-bırak akıcı kalıyor mu?

## Teknik İpuçları

- dnd-kit modern ve halen geliştirilmekte olan bir kütüphane (react-beautiful-dnd için artık bakım desteği verilmiyor)

- Sıralama verisi için: her kartın arasına yeni bir kartı ekleyebilir misin, yoksa tüm sıralaması yeniden mi hesaplamanız gerekir?

- Kartı sürüklerken gölge, renk değişimi gibi görsel ipuçları verilmesi kullanıcı deneyimi iyileştirir

## Bu Projede Neye Bakacağız?

- Sürükle-bırakın sorunsuz çalışması (görsel ipuçları, doğru sıralama, veri kaydedilmesi)

- Sıralama mantığının sağlamlığı (sayfa yenilemesinde korunması)

- Veri modelinin tutarlılığı (board → sütun → kart ilişkisi)

- Kütüphane seçiminin bilinçli yapılmış olması

- Mobil kullanılabilirlik

- Kod kalitesi ve mimari tutarlılığı

- 48 saatte neye odaklandığın: temel sürükle-bırak mı mükemmel, yoksa çok özellik mi yarım?





---

# TaskFlow Specification v1

**Project:** TaskFlow — Kanban Proje Yönetim Tahtası
**Target:** Koç Sistem NewChapter Teknik Test
**Document Type:** Product + Engineering Specification
**Audience:** Candidate, AI coding agent, reviewer
**Primary Goal:** 48 saat içinde çalışan, deploy edilmiş, teknik kararları savunulabilir bir web uygulaması teslim etmek

---

## 1. Executive Summary

TaskFlow, kullanıcıların giriş yapabildiği, kendi board’larını oluşturabildiği, board içinde sütunlar ve kartlar ekleyebildiği, kartları sürükle-bırak ile sütunlar arasında taşıyabildiği bir Kanban uygulamasıdır.

Bu projenin asıl değerlendirme ekseni çok özellik yapmak değildir. Asıl ölçülenler:

* çekirdek kullanıcı akışlarının sorunsuz çalışması
* drag-and-drop deneyiminin sağlamlığı
* sıralamanın kalıcı olması
* veri modelinin tutarlı olması
* teknik seçimlerin bilinçli yapılması
* 48 saatlik scope yönetimi

Bu nedenle ürün stratejisi şudur:

> “Daha az özellik, ama kusursuz temel akış.”

---

## 2. Product Strategy

### 2.1 Product Thesis

Küçük yazılım ekipleri için görevlerin durum bazlı takibini sağlayan, Trello benzeri, minimal ama güvenilir bir görev yönetim aracı geliştirilecektir.

### 2.2 Product Principles

1. **Core interaction first:** Kart oluşturma, görüntüleme, düzenleme, taşıma kusursuz olmalı.
2. **Persistence is non-negotiable:** Refresh sonrası sıra bozulmamalı.
3. **Low-friction UX:** Hızlı board yönetimi, kolay kart düzenleme.
4. **Mobile-respectful design:** Mobilde düzgün görünmeli ve bozulmamalı.
5. **Conscious scope control:** Yarım çalışan gelişmiş özellikler yerine tam çalışan çekirdek deneyim.

### 2.3 In-Scope

* kullanıcı kaydı / giriş
* board oluşturma
* sütun oluşturma
* kart oluşturma
* kart düzenleme
* kartların aynı sütun içinde yeniden sıralanması
* kartların sütunlar arasında taşınması
* sıralamanın kalıcı saklanması
* responsive layout
* Vercel deploy

### 2.4 Out-of-Scope for v1

* gerçek zamanlı collaboration
* board sharing with permissions
* activity history
* comments
* attachments
* assignee sistemi
* advanced filtering
* notifications
* offline-first sync
* column reorder drag-and-drop

Bu maddeler README’de “future enhancements” olarak belirtilecektir.

---

## 3. Success Criteria

Reviewer’ın gözünden başarılı teslimat şu demektir:

### 3.1 Functional Success

* kullanıcı register/login yapabiliyor
* board oluşturabiliyor
* board içinde en az 3 sütun kullanabiliyor
* kart ekleyebiliyor
* kart başlık/açıklamasını düzenleyebiliyor
* kartı sürükleyerek aynı sütunda yer değiştirebiliyor
* kartı başka sütuna taşıyabiliyor
* sayfa yenileyince sıralama aynı kalıyor

### 3.2 Technical Success

* veri modeli net
* drag-and-drop kararlı
* persistence mantığı tutarlı
* state yönetimi karmaşık değil
* proje deploy edilmiş
* README teknik kararları açıklıyor

### 3.3 Product Success

* kullanım akışı sezgisel
* gereksiz karmaşa yok
* temel senaryo hızlı çalışıyor
* mobil görünüm kırılmıyor

---

## 4. User Personas and Primary Use Cases

### 4.1 Persona

**Primary user:** küçük yazılım ekibinin bireysel üyesi veya takım lideri

### 4.2 Primary Jobs To Be Done

* görevlerini sütunlar üzerinden takip etmek
* görev durumunu hızlıca güncellemek
* kartları sürükleyerek iş akışını görselleştirmek
* board durumunu refresh sonrası da kaybetmemek

### 4.3 Core Use Cases

1. kullanıcı hesap oluşturur
2. giriş yapar
3. yeni board oluşturur
4. board içinde sütunlar oluşturur
5. sütunlara kart ekler
6. kartı başka sütuna taşır
7. kart detaylarını günceller
8. sonra tekrar gelip aynı board’u aynı sırada görür

---

## 5. Information Architecture

### 5.1 Pages

* `/login`
* `/register`
* `/boards`
* `/boards/[boardId]`

### 5.2 Entities

* User
* Board
* Column
* Card

### 5.3 Ownership Model

Her board tek bir kullanıcıya aittir.
v1’de sadece board sahibi erişebilir.

---

## 6. Functional Specification

# 6.1 Authentication

## Requirements

* kullanıcı email + password ile register olabilir
* kullanıcı login olabilir
* authenticated değilse protected page’lere erişemez
* logout yapılabilir

## UX

* basit form
* loading state
* error message
* auth sonrası `/boards` sayfasına yönlendirme

## Technical Notes

* Supabase Auth kullanılacak
* session server/client senkronizasyonu düzgün kurulmalı

---

# 6.2 Board Management

## Requirements

* kullanıcı board listesi görebilmeli
* yeni board oluşturabilmeli
* board başlığı düzenlenebilir olması opsiyonel
* board silme v1’de opsiyonel, yapılmayabilir

## Minimum Acceptance

* board create
* board list
* board detail navigation

---

# 6.3 Column Management

## Requirements

* board içine sütun eklenebilmeli
* sütun adı girilebilmeli
* sütunlar position alanına göre sıralanmalı
* boş sütun görüntülenebilmeli
* sütun silme opsiyonel

## v1 Decision

* sütun ekleme var
* sütun silme yok ya da çok basit
* sütun reorder yok

---

# 6.4 Card Management

## Requirements

* kart eklenebilmeli
* kart başlık zorunlu
* açıklama opsiyonel
* kart detay modal veya drawer içinde düzenlenebilmeli
* kartlar sütun içinde listelenmeli

## v1 Decision

* title + description yeterli
* etiket/due date/assignee ertelenebilir

---

# 6.5 Drag and Drop

## Requirements

* kartlar aynı sütun içinde reorder olmalı
* kartlar sütunlar arası taşınmalı
* drag sırasında görsel feedback olmalı
* drag sonrası veri kalıcı olmalı
* refresh sonrası aynı sıra görülmeli

## UX Expectations

* dragged card hafif saydam olabilir
* target area görsel olarak belirgin olmalı
* boş sütuna drop mümkün olmalı
* drop sonrası liste anında güncellenmeli

## v1 Critical Constraint

Bu özellik ürünün merkezidir. En yüksek mühendislik dikkati buraya verilecektir.

---

# 6.6 Persistence

## Requirements

* board, column, card verileri DB’de saklanmalı
* kartların sırası DB seviyesinde saklanmalı
* refresh sonrası aynen dönmeli

## Non-negotiable

Kart order’ı ephemeral UI state’te kalamaz.

---

# 6.7 Responsive Design

## Requirements

* desktop’ta yatay board görünümü
* mobilde yatay scroll kabul edilebilir
* kart ve sütunlar taşmamalı
* form/modallar mobilde erişilebilir olmalı

## Important

Mobil native drag perfection beklenmiyor; fakat layout bozuk olmamalı.

---

## 7. Non-Functional Requirements

### 7.1 Reliability

* veri kaybı olmamalı
* drag sonrası state bozulmamalı
* refresh sonrası sıra kaybolmamalı

### 7.2 Maintainability

* bileşenler küçük ve sorumluluğu net olmalı
* veri katmanı ve UI katmanı ayrılmalı
* types tanımlı olmalı

### 7.3 Performance

* onlarca kartta akıcı kalmalı
* gereksiz rerender minimize edilmeli
* tüm board her harekette yeniden hesaplanmamalı

### 7.4 Security

* kullanıcı sadece kendi board’larına erişebilmeli
* row-level security tercih edilmeli

### 7.5 Developer Experience

* hızlı local setup
* net environment variables
* okunabilir README

---

## 8. Architecture Decision Record

# 8.1 Frontend Framework

## Decision

**Next.js + TypeScript**

## Rationale

* Vercel deploy doğal
* route yapısı temiz
* modern React ekosistemi
* production-grade görünür

---

# 8.2 Styling

## Decision

**Tailwind CSS**

## Rationale

* hız
* tutarlı UI
* responsive geliştirme kolaylığı
* case süresine uygun

---

# 8.3 Backend / Data

## Decision

**Supabase**

## Rationale

* auth hazır
* PostgreSQL hazır
* hızlı kurulum
* iyi DX
* Vercel ile uyumlu
* RLS desteği

---

# 8.4 Drag-and-Drop

## Decision

**dnd-kit**

## Rationale

* modern
* aktif olarak geliştiriliyor
* React için esnek
* touch desteği için daha uygun
* custom Kanban interaction’larına elverişli

## Rejected Alternatives

### @hello-pangea/dnd

* avantaj: kullanımı nispeten kolay
* dezavantaj: geleceğe dönük esneklik daha sınırlı

### SortableJS

* avantaj: hızlı
* dezavantaj: React state ile entegrasyonu daha dağınık olabilir

### native HTML5 drag-and-drop

* dezavantaj: mobil zayıf, UX kalitesi daha düşük

---

# 8.5 State Management

## Decision

* server state: Supabase fetch/persist
* UI state: React local state
* global store: başlangıçta yok

## Rationale

48 saatlik case için en basit yeterli çözüm.

---

## 9. Data Model Specification

### 9.1 Entity: Board

Fields:

* `id: uuid`
* `user_id: uuid`
* `title: text`
* `created_at: timestamptz`

Constraints:

* board owner bir kullanıcıdır
* title boş olamaz

### 9.2 Entity: Column

Fields:

* `id: uuid`
* `board_id: uuid`
* `title: text`
* `position: numeric`
* `created_at: timestamptz`

Constraints:

* her column bir board’a aittir
* board içi sıralama `position` ile belirlenir

### 9.3 Entity: Card

Fields:

* `id: uuid`
* `column_id: uuid`
* `title: text`
* `description: text`
* `position: numeric`
* `created_at: timestamptz`
* `updated_at: timestamptz`

Constraints:

* her card bir column’a aittir
* column içi sıralama `position` ile belirlenir

---

## 10. Ordering Strategy Specification

Bu proje için en kritik teknik karar budur.

# 10.1 Problem

Kart sıralaması refresh sonrası korunmalı. Drag sonrası kartlar yeni sırada DB’ye yazılmalı. Sadece array index’e güvenilemez.

# 10.2 Decision

Her card için `position` alanı tutulacak.
Pozisyonlar başlangıçta geniş aralıklı atanacak:

* 1000
* 2000
* 3000

Araya yeni kart eklenirse:

* önceki ve sonraki kartın ortası alınır

Örnek:

* prev = 1000
* next = 2000
* new = 1500

# 10.3 Benefits

* tüm column’ı her seferinde reindex etmek gerekmez
* daha az DB update
* insert verimli
* savunulabilir ürün mühendisliği kararı

# 10.4 Edge Cases

### Empty column

İlk kartın position’ı `1000`

### Drop to top

İlk kartın önüne eklenirse `next.position / 2` veya `next.position - gap`

### Drop to bottom

Son karta eklenirse `last.position + 1000`

### Positions too dense

Nadir durumda ilgili column için reindex:

* 1000, 2000, 3000, ...

# 10.5 Reindex Policy

v1’de basit politika:

* eğer prev ve next arasında yeterli boşluk yoksa column reindex yapılır

---

## 11. Drag-and-Drop Behavior Specification

# 11.1 Drag Source

Kart

# 11.2 Drop Targets

* aynı column içindeki index aralıkları
* başka column içi index aralıkları
* boş column container

# 11.3 Required Scenarios

1. same-column reorder
2. move to another column
3. move to empty column
4. move to top of column
5. move to bottom of column

# 11.4 Interaction Lifecycle

### onDragStart

* active card id set edilir
* drag overlay için card verisi tutulur

### onDragOver

* geçici UI yerleşimi güncellenebilir
* ama gereksiz ağır hesap yapılmamalı

### onDragEnd

* source column bulunur
* target column bulunur
* target index hesaplanır
* new position hesaplanır
* local state optimistic update yapılır
* DB persist edilir
* hata olursa rollback veya refetch yapılır

# 11.5 UX Feedback

* dragged item shadow
* opacity change
* destination highlight
* pointer-friendly spacing

---

## 12. Mobile Interaction Specification

# 12.1 Constraints

Mobilde drag başlatma desktop kadar sorunsuz değildir.

# 12.2 Decision

Touch sensor kullanılacak ve activation constraint verilecek.

Örnek strateji:

* küçük delay veya minimum distance
* kısa tap = kart aç
* daha bilinçli hareket = drag

# 12.3 Acceptance

* yanlış drag sayısı azaltılmalı
* layout mobilde kırılmamalı
* tam mobil-perfect drag beklenmez

---

## 13. API / Data Access Layer Specification

Supabase doğrudan kullanılacağı için geleneksel REST şart değildir. Yine de internal abstraction önerilir.

### 13.1 Board Queries

* `getBoardsByUser(userId)`
* `createBoard(title)`
* `getBoardWithColumnsAndCards(boardId)`

### 13.2 Column Queries

* `createColumn(boardId, title, position)`

### 13.3 Card Queries

* `createCard(columnId, title, description, position)`
* `updateCard(cardId, payload)`
* `moveCard(cardId, newColumnId, newPosition)`

### 13.4 Data Layer Principle

UI doğrudan karmaşık SQL mantığı bilmemeli.
Veri erişimi `lib` veya `features/*/queries.ts` içinde toplanmalı.

---

## 14. UI Component Specification

### 14.1 BoardPage

Responsibilities:

* board data fetch
* board layout render
* DnD context host
* create column action

### 14.2 ColumnComponent

Responsibilities:

* column header
* cards list
* add card action
* drop zone behavior

### 14.3 CardItem

Responsibilities:

* show title
* preview description
* drag handle zone or full-card drag
* open edit modal

### 14.4 CardModal

Responsibilities:

* edit title
* edit description
* save changes
* close/cancel

### 14.5 CreateBoardDialog

### 14.6 CreateColumnInput

### 14.7 CreateCardInput

---

## 15. UX Specification

### 15.1 Boards Page

* temiz liste
* “Create Board” CTA net
* boş durumda empty state

### 15.2 Board Detail

* yatay sütun dizilimi
* sütun genişliği sabit/minmax
* kartlar okunabilir
* ekleme girişleri kolay ulaşılır

### 15.3 Visual Priority

1. kart taşıma
2. kart düzenleme
3. board gezilebilirliği

### 15.4 UX Enhancements Worth Doing

* toast feedback
* skeleton/loading states
* empty states
* subtle hover states

---

## 16. Security and Access Control

### 16.1 Authentication

Supabase Auth

### 16.2 Authorization

Her kullanıcı sadece kendi board’larına erişebilir.

### 16.3 Preferred Implementation

Supabase Row Level Security

### 16.4 Minimum Rule Set

* boards: owner only
* columns: parent board owner only
* cards: parent board owner only

---

## 17. Error Handling Specification

### 17.1 Create Failures

* toast/error message
* form açık kalsın

### 17.2 Drag Persist Failure

* optimistic update sonrası save fail ederse:

  * refetch ile düzelt
  * kullanıcıya “move could not be saved” benzeri geri bildirim ver

### 17.3 Auth Failure

* anlaşılır mesaj
* redirect loop olmamalı

---

## 18. Testing Strategy

48 saatte exhaustive test değil, kritik akış testi yapılmalı.

### 18.1 Manual Test Checklist

* register works
* login works
* logout works
* create board works
* create column works
* create card works
* edit card works
* reorder card in same column works
* move card across columns works
* refresh preserves order
* move to empty column works
* responsive layout works
* unauthorized access blocked

### 18.2 Optional Automated Tests

Zaman kalırsa:

* utility test for position calculation
* component smoke tests

En yüksek ROI’li test:

* `calculateNewPosition(...)`

---

## 19. Performance Strategy

### 19.1 Risks

* board rerender flood
* drag hareketinde ağır state mutation
* çok kartta yavaş UI

### 19.2 Mitigations

* memoized column/card components
* normalize or semi-normalize board state
* minimal updates on drop
* drag overlay usage
* only persist on drag end

### 19.3 Explicit Non-Goal

Virtualization v1’de zorunlu değil.

---

## 20. Deployment Specification

### 20.1 Platform

Vercel

### 20.2 Requirements

* production env vars set
* auth redirect URLs correct
* deployed link stable
* README’de canlı link yer almalı

### 20.3 Deliverables

* GitHub repository
* Vercel live demo
* README
* optionally screenshots/GIF

---

## 21. README Specification

README aşağıdaki bölümleri içermeli:

1. Project overview
2. Features
3. Tech stack
4. Architecture decisions
5. Data model
6. Ordering strategy
7. Setup instructions
8. Environment variables
9. Deployment link
10. Trade-offs / scope decisions
11. Future improvements

### Must-have explanation

* neden dnd-kit
* neden `position` alanı
* neden column reorder / collaboration ertelendi
* 48 saatte neye odaklanıldığı

---

## 22. Delivery Strategy for Reviewers

Reviewer’a hissettirilmesi gereken şey:

> “Aday, ürün önceliklendirme biliyor, teknik borcu yönetebiliyor, kritik UX akışını sağlam tasarlamış.”

Bu nedenle submission mesajı ve README dili şu eksende olmalı:

* bilinçli kararlar
* kontrollü kapsam
* core flow mükemmelliği
* future extensibility

---

## 23. Implementation Plan for AI Agent

AI agent’a görev verirken modüler ilerlemek gerekir. Tek dev prompt yerine fazlı ilerleme yapılmalı.

### Phase 1 — Foundation

* Next.js app scaffold
* Tailwind
* Supabase setup
* auth pages
* route guards

### Phase 2 — Data Model

* SQL schema
* RLS policies
* typed interfaces

### Phase 3 — Board CRUD

* boards page
* create board
* board detail page

### Phase 4 — Columns and Cards

* create column
* create card
* render structure
* edit card modal

### Phase 5 — Drag and Drop

* dnd-kit integration
* same-column reorder
* cross-column move
* persist order

### Phase 6 — Polish

* loading states
* responsive layout
* toasts
* error states

### Phase 7 — Delivery

* README
* deploy
* bug bash

---

## 24. AI Agent Prompting Rules

AI agent ile çalışırken şu kurallar uygulanmalı:

1. Her adımda tam dosya ağacı isteme.
2. Önce tasarım kararı, sonra kod üretimi.
3. Her task için acceptance criteria ver.
4. Büyük refactor istemeden önce mevcut durum özetlet.
5. Drag-and-drop logic’i agent’a tek seferde değil, parça parça yaptır.
6. Her üretilen fonksiyon için edge case sorgulat.

### Good prompt example

“Implement `calculateNewPosition` utility for same-column and cross-column insert cases. Cover empty column, insert at top, middle, bottom, and dense-position fallback. Return TypeScript code and 6 test cases.”

---

## 25. Trade-Off Record

### Chosen

* strong card DnD
* persistent ordering
* simple ownership model
* responsive board UI

### Deferred

* column reorder
* tags
* due dates
* assignees
* activity history
* collaboration

### Reason

48 saatlik sürede çekirdek kullanıcı deneyimi ve veri tutarlılığı daha yüksek önceliktedir.

---

## 26. Risks and Mitigations

### Risk 1

DnD karmaşıklığı teslimatı bozar
**Mitigation:** column reorder kapsam dışı

### Risk 2

Order persistence bug çıkar
**Mitigation:** position strategy + manual test checklist

### Risk 3

Supabase auth redirect sorunları
**Mitigation:** deploy öncesi env ve redirect config doğrulama

### Risk 4

Mobilde drag kötü hissettirir
**Mitigation:** touch sensor constraint + responsive polish

### Risk 5

Aşırı feature creep
**Mitigation:** strict v1 scope

---

## 27. Final Acceptance Criteria

Proje tamamlandı sayılabilmesi için aşağıdakilerin hepsi doğru olmalı:

* live Vercel link açılıyor
* user register/login yapabiliyor
* board create edebiliyor
* board içinde column create edebiliyor
* cards create/edit edebiliyor
* cards same-column reorder oluyor
* cards cross-column move oluyor
* refresh sonrası order korunuyor
* mobil görünüm kullanılabilir
* README teknik kararları açıklıyor

---

## 28. Recommended v1 Tech Stack Snapshot

* Next.js
* TypeScript
* Tailwind CSS
* Supabase Auth + Postgres
* dnd-kit
* Vercel
* optional: shadcn/ui
* optional: sonner/toast library

---

## 29. Recommended v1 Feature Cut

Kesin yap:

* auth
* boards
* columns
* cards
* edit modal
* card DnD
* persistence
* responsive
* deploy

Sadece zaman kalırsa:

* tags
* due date
* board rename
* column delete

---

