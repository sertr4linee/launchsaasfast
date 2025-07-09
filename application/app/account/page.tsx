"use client";

export default function AccountPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Basic information</h1>
      {/* Formulaire d'édition du nom/email à ajouter ici */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-2 text-red-400">Delete account</h2>
        <div className="bg-gray-900 p-4 rounded mb-2">
          <p className="text-red-300 mb-2 font-medium">Important Information</p>
          <ul className="text-sm text-red-200 list-disc ml-6 mb-2">
            <li>All your personal information and settings will be permanently erased</li>
            <li>Your account cannot be recovered once deleted</li>
            <li>All your data will be removed from our servers</li>
          </ul>
          <button className="bg-red-600 text-white px-4 py-2 rounded mt-2">I understand, delete my account</button>
        </div>
      </div>
    </div>
  );
}
