import React, { useState } from 'react';
import { ShoppingBag, FileText, Package, BarChart2, LogOut, Search, CheckCircle } from 'lucide-react';

export default function App() {
  // Имитируем, что пользователь уже залогинен для быстроты теста
  const [user, setUser] = useState({
    id: 1,
    fio: "Иванов Александр Петрович",
    city: "Душанбе",
    group: "Кардиология",
    plan: "45 000 сомони",
    progress: "75%"
  });

  const [screen, setScreen] = useState('dashboard'); // Переключатель экранов
  const [search, setSearch] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [cart, setCart] = useState({});

  // Фейковые данные для работы без интернета прямо сейчас
  const samplePharmacies = [
    { id: 1, number: "65", name: "Аптека Мадад", address: "ул. Рудаки, 45", phone: "+992 900 11 2233" },
    { id: 2, number: "102", name: "Аптека Сино", address: "пр. Исмоила Сомони, 12", phone: "+992 935 55 6677" }
  ];

  const sampleProducts = [
    { id: 101, name: "Кардиофарм 20 мг", sku: "KF001", price: 120, stock: 450 },
    { id: 102, name: "Випрелакс Капсулы", sku: "VP054", price: 85, stock: 120 },
    { id: 103, name: "Терфлю Порошок", sku: "TF009", price: 45, stock: 800 }
  ];

  const handleQtyChange = (id, qty) => {
    setCart(prev => ({ ...prev, [id]: { ...prev[id], qty: parseInt(qty) || 0 } }));
  };

  const handleDiscountChange = (id, disc) => {
    setCart(prev => ({ ...prev, [id]: { ...prev[id], disc: parseInt(disc) || 0 } }));
  };

  // Подсчет общей суммы корзины
  const calculateTotal = () => {
    return sampleProducts.reduce((sum, p) => {
      const item = cart[p.id];
      if (!item || !item.qty) return sum;
      const priceAfterDiscount = p.price * (1 - (item.disc || 0) / 100);
      return sum + (priceAfterDiscount * item.qty);
    }, 0);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-gray-50 pb-10">
      
      {/* ЭКРАН 1: ГЛАВНОЕ МЕНЮ (DASHBOARD) */}
      {screen === 'dashboard' && (
        <div>
          {/* Сбер-Шапка */}
          <div className="bg-[#00ae4a] text-white p-6 rounded-b-[32px] shadow-lg">
            <p className="text-xs opacity-80 uppercase tracking-wider">Личный кабинет</p>
            <h1 className="text-2xl font-bold mt-1">{user.fio}</h1>
            <div className="mt-3 flex gap-4 text-xs opacity-90 border-t border-white/20 pt-3">
              <div>📍 {user.city}</div>
              <div>💊 Группа: {user.group}</div>
            </div>
            <div className="mt-4 bg-white/10 p-3 rounded-xl">
              <div className="flex justify-between text-xs mb-1">
                <span>Выполнение плана ({user.plan})</span>
                <span className="font-bold">{user.progress}</span>
              </div>
              <div className="w-full bg-white/25 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white h-full" style={{ width: user.progress }}></div>
              </div>
            </div>
          </div>

          {/* Большие плиточные кнопки под одну руку */}
          <div className="p-4 grid grid-cols-2 gap-4 mt-4">
            <button onClick={() => setScreen('select_pharmacy')} className="sber-card flex flex-col items-center justify-center p-6 active:scale-95 transition-transform h-32 text-center">
              <ShoppingBag className="w-8 h-8 text-[#00ae4a] mb-2" />
              <span className="text-sm font-bold">🏥 Создать заказ</span>
            </button>
            <button onClick={() => alert('История пуста')} className="sber-card flex flex-col items-center justify-center p-6 active:scale-95 transition-transform h-32 text-center">
              <FileText className="w-8 h-8 text-[#00ae4a] mb-2" />
              <span className="text-sm font-bold">📋 История</span>
            </button>
            <button onClick={() => alert('Каталог откроется в заказе')} className="sber-card flex flex-col items-center justify-center p-6 active:scale-95 transition-transform h-32 text-center">
              <Package className="w-8 h-8 text-[#00ae4a] mb-2" />
              <span className="text-sm font-bold">💊 Препараты</span>
            </button>
            <button onClick={() => alert('Статистика за месяц: 100%')} className="sber-card flex flex-col items-center justify-center p-6 active:scale-95 transition-transform h-32 text-center">
              <BarChart2 className="w-8 h-8 text-[#00ae4a] mb-2" />
              <span className="text-sm font-bold">📊 Статистика</span>
            </button>
          </div>
        </div>
      )}

      {/* ЭКРАН 2: ВЫБОР АПТЕКИ */}
      {screen === 'select_pharmacy' && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Выбор аптеки</h2>
            <button onClick={() => setScreen('dashboard')} className="text-sm text-gray-500 font-bold">Назад</button>
          </div>
          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder="Введите номер или название..." 
              className="sber-input pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
          </div>
          <div className="space-y-3">
            {samplePharmacies.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.number.includes(search)).map(p => (
              <div key={p.id} onClick={() => { setSelectedPharmacy(p); setScreen('catalog'); }} className="sber-card p-4 cursor-pointer active:bg-gray-100 transition-colors">
                <div className="font-bold text-[#00ae4a] text-lg">Аптека №{p.number}</div>
                <div className="font-semibold text-gray-800 mt-0.5">{p.name}</div>
                <div className="text-xs text-gray-400 mt-1">📍 {p.address}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ЭКРАН 3: КАТАЛОГ ПРЕПАРАТОВ И ОФОРМЛЕНИЕ */}
      {screen === 'catalog' && (
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold">Заказ для Аптеки №{selectedPharmacy?.number}</h2>
              <p className="text-xs text-gray-400">{selectedPharmacy?.name}</p>
            </div>
            <button onClick={() => setScreen('select_pharmacy')} className="text-sm text-gray-500 font-bold">Назад</button>
          </div>

          <div className="space-y-4 my-4 flex-1 overflow-y-auto">
            {sampleProducts.map(p => {
              const item = cart[p.id] || { qty: 0, disc: 0 };
              const currentPrice = p.price * (1 - item.disc / 100);
              return (
                <div key={p.id} className="sber-card p-4 flex flex-col gap-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                    <div className="text-xs text-gray-400">Артикул: {p.sku} | Склад: {p.stock} шт</div>
                  </div>
                  <div className="flex justify-between items-center border-t border-b border-gray-100 py-2">
                    <span className="text-xs text-gray-500">Цена за шт:</span>
                    <span className="font-bold text-gray-900">{p.price} сомони</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1 font-semibold">Количество</label>
                      <input 
                        type="number" 
                        placeholder="0"
                        className="sber-input p-2.5 text-center"
                        onChange={(e) => handleQtyChange(p.id, e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1 font-semibold">Скидка</label>
                      <select 
                        className="sber-input p-2.5 text-center bg-white"
                        onChange={(e) => handleDiscountChange(p.id, e.target.value)}
                      >
                        <option value="0">0%</option>
                        <option value="3">3%</option>
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                        <option value="20">20%</option>
                      </select>
                    </div>
                  </div>
                  {item.qty > 0 && (
                    <div className="text-right text-xs font-bold text-[#00ae4a]">
                      Итог по позиции: {currentPrice * item.qty} сомони
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Закрепленная нижняя плашка с итогом и кнопкой */}
          <div className="mt-auto bg-white p-4 -mx-4 -mb-10 rounded-t-[24px] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-medium">Общая сумма заказа:</span>
              <span className="text-2xl font-black text-gray-900">{calculateTotal()} сомони</span>
            </div>
            <button 
              disabled={calculateTotal() === 0}
              onClick={() => setScreen('success')} 
              className="sber-btn disabled:bg-gray-300 disabled:shadow-none"
            >
              Отправить заказ на склад
            </button>
          </div>
        </div>
      )}

      {/* ЭКРАН 4: УСПЕШНО ОТПРАВЛЕНО */}
      {screen === 'success' && (
        <div className="p-6 flex flex-col items-center justify-center flex-1 text-center my-auto">
          <CheckCircle className="w-20 h-20 text-[#00ae4a] mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-gray-950">Заказ успешно отправлен!</h2>
          <p className="text-sm text-gray-500 mt-2 px-6">Система автоматически рассчитала стоимость, сформировала накладную PDF/Excel и уведомила склад.</p>
          <button onClick={() => { setCart({}); setScreen('dashboard'); }} className="sber-btn mt-8 max-w-xs">
            Вернуться в главное меню
          </button>
        </div>
      )}

    </div>
  );
}